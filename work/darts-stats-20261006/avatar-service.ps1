param([ValidateSet('start','status','stop','restart')][string]$Mode='status')
$ErrorActionPreference='Stop'
$directory=$PSScriptRoot
$runtime=Get-Content -LiteralPath (Join-Path $directory 'avatar-runtime.json') -Raw | ConvertFrom-Json
$service=$runtime.services.avatar
$entry=[IO.Path]::GetFullPath($service.entry)
$receiptPath=Join-Path $directory 'avatar-service-receipt.json'
$guardName='Local\JoeDartsAvatar8794'
$guard=[Threading.Mutex]::new($false,$guardName)
$admitted=$false
try {
 try {$admitted=$guard.WaitOne(15000)}catch [Threading.AbandonedMutexException]{$admitted=$true}
 if(!$admitted){throw 'The retained service transition is already running; no second process launched'}
$listeners=@(Get-NetTCPConnection -LocalPort $service.port -State Listen -ErrorAction SilentlyContinue)
function OwnedProcess($processId){
 $process=Get-CimInstance Win32_Process -Filter "ProcessId=$processId"
 if(!$process -or !$process.CommandLine -or !$process.CommandLine.Contains($entry)){throw "Port/process owner is not the retained avatar service; preserved"}
 return $process
}
if($Mode -eq 'stop'){
 if(!(Test-Path -LiteralPath $receiptPath)){throw 'No retained service process receipt'}
 $prior=Get-Content -LiteralPath $receiptPath -Raw|ConvertFrom-Json
 $owned=OwnedProcess $prior.pid
 if([string]$owned.CreationDate -ne [string]$prior.creationDate){throw 'Process identity changed; preserved'}
 Stop-Process -Id $owned.ProcessId
 $prior|Add-Member -Force NoteProperty stoppedAt ([DateTime]::UtcNow.ToString('o'))
 $prior|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $receiptPath
 $prior|ConvertTo-Json -Depth 8
 exit
}
if($Mode -eq 'restart' -and $listeners.Count){
 $owned=OwnedProcess $listeners[0].OwningProcess
 if(!(Test-Path -LiteralPath $receiptPath)){throw 'No retained service process receipt'}
 $prior=Get-Content -LiteralPath $receiptPath -Raw|ConvertFrom-Json
 if($prior.pid -ne $owned.ProcessId -or [string]$owned.CreationDate -ne [string]$prior.creationDate){throw 'Restart process identity changed; preserved'}
 Stop-Process -Id $owned.ProcessId
 $listeners=@()
}
if($listeners.Count){$owned=OwnedProcess $listeners[0].OwningProcess;$action='reused'}
elseif($Mode -in @('start','restart')){
 $node=(Get-Command node -ErrorAction Stop).Source
 $created=Start-Process -FilePath $node -ArgumentList @('"'+$entry+'"') -WorkingDirectory $directory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $directory 'avatar-service.stdout.log') -RedirectStandardError (Join-Path $directory 'avatar-service.stderr.log') -PassThru
 $owned=OwnedProcess $created.Id;$action='started-detached'
}else{throw 'Retained avatar service is not listening'}
$url='http://'+$service.host+':'+$service.port+'/avatar-state'
$health=$null
for($attempt=0;$attempt -lt 20;$attempt++){try{$health=Invoke-RestMethod -Uri $url -TimeoutSec 3;break}catch{if($attempt -eq 19){throw};Start-Sleep -Milliseconds 250}}
$receipt=[ordered]@{address=$receiptPath;source=(Join-Path $directory 'avatar-runtime.json');entry=$entry;entrySha256=(Get-FileHash -LiteralPath $entry -Algorithm SHA256).Hash;pid=$owned.ProcessId;creationDate=[string]$owned.CreationDate;commandLine=$owned.CommandLine;host=$service.host;port=$service.port;action=$action;health=$health;observedAt=[DateTime]::UtcNow.ToString('o');boundary='Detached hidden Windows process and HTTP health; actual application restart not tested'}
$receipt|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $receiptPath
$receipt|ConvertTo-Json -Depth 8 -Compress|Add-Content -LiteralPath (Join-Path $directory 'avatar-service-transitions.jsonl')
$receipt|ConvertTo-Json -Depth 8
} finally {
 if($admitted){$guard.ReleaseMutex()}
 $guard.Dispose()
}
