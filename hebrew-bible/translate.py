#!/usr/bin/env python3
"""Source-addressed template adapter for the existing WHY Translate engine."""
from __future__ import annotations
import argparse, gzip, hashlib, json, re, sys
from datetime import datetime, timezone
from pathlib import Path
READER_SHA='0a07e1124e621efdeb9b475f41173700fced622e81b06bff980cae2732acf985'
REQUEST_PROTOCOL='HEBREW-TEMPLATE-TRANSLATION-REQUEST/1'
OUTPUT_PROTOCOL='HEBREW-VERSE-RENDERINGS/1'

def cid(value):
    return 'sha256:'+hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def load_source(path):
    raw=gzip.decompress(path.read_bytes())
    if hashlib.sha256(raw).hexdigest()!=READER_SHA: raise ValueError('Retained reader source identity mismatch')
    text=raw.decode('utf-8')
    if not text.startswith('window.HEBREW_BIBLE_DATA'): raise ValueError('Unexpected source carrier')
    return json.loads(text.split('=',1)[1].strip().removesuffix(';'))

def select_request(payload,data,scope='request'):
    if payload.get('protocol')!=REQUEST_PROTOCOL or payload.get('sourceRoot')!=data['source']['ledgerAddress']: raise ValueError('Request does not select this exact Hebrew corpus')
    if payload.get('sourceReader')!='sha256:'+READER_SHA: raise ValueError('Request reader identity mismatch')
    language=payload.get('targetLanguage','')
    if not isinstance(language,str) or not re.fullmatch(r'[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*',language) or language.lower()=='he': raise ValueError('Select a target language tag other than Hebrew')
    template=payload.get('template')
    if not isinstance(template,dict) or not isinstance(template.get('id'),str) or not isinstance(template.get('instructions'),str) or not template['instructions'].strip() or len(template['instructions'])>6000: raise ValueError('Select a bounded translation template')
    if payload.get('templateAddress')!=cid(template): raise ValueError('Selected template identity mismatch')
    if scope=='request': scope=payload.get('scope','request')
    if scope not in ('request','book','corpus'): raise ValueError('Unknown translation scope')
    selected=payload.get('chapter',{})
    chapters=[]
    for book in data['books']:
        for chapter in book['chapters']:
            match=book['osisId']==selected.get('book') and str(chapter['number'])==str(selected.get('number'))
            if scope=='corpus' or (scope=='book' and book['osisId']==selected.get('book')) or match: chapters.append((book,chapter))
    original=next((c for b,c in chapters if b['osisId']==selected.get('book') and str(c['number'])==str(selected.get('number'))),None)
    if original is None: raise ValueError('Selected chapter boundary mismatch')
    expected=[{'sourceAddress':v['address'],'number':v['number'],'hebrew':v['hebrew']} for v in original['verses']]
    if payload.get('verses')!=expected: raise ValueError('Request source occurrences or Hebrew bytes differ')
    return language,template,chapters

def make_request(data,book,chapter,language,template):
    from whytranslate import CausalContext,TranslationRequest
    rows=[{'sourceAddress':v['address'],'hebrew':v['hebrew']} for v in chapter['verses']]
    context=CausalContext(was='UNKNOWN: no interpretation of the preceding biblical event is admitted.',is_now='UNKNOWN: source meaning and speaker intent are not supplied by metadata.',can_be=(),speaker='unknown',listener='unknown',intent='Render retained Hebrew under the selected template; unobserved biblical intent stays unknown.',domain='Biblical Hebrew / '+data['source']['ledgerAddress'],surrounding_text=json.dumps({'sourceRoot':data['source']['ledgerAddress'],'chapter':{'book':book['osisId'],'number':chapter['number']},'selectedTemplate':template,'templateAddress':cid(template),'outputContract':'Return target_text as a JSON array of objects {sourceAddress, text}. Preserve every sourceAddress exactly once. Render the complete passage in context, retaining verse boundaries. Do not invent passages, doctrine, speakers or certainty. Report unresolved distinctions in the candidate unresolved field.'},ensure_ascii=False,sort_keys=True))
    return TranslationRequest('hbo',language,json.dumps(rows,ensure_ascii=False,separators=(',',':')),context)

def project_candidate(candidate,request,data,chapter,language,template):
    rows=json.loads(candidate.target_text)
    if not isinstance(rows,list): raise ValueError('Candidate target_text must be the addressed JSON row array')
    by_address={v['address']:v for v in chapter['verses']}; seen=set(); output=[]
    for row in rows:
        if not isinstance(row,dict) or row.get('sourceAddress') not in by_address or row['sourceAddress'] in seen or not isinstance(row.get('text'),str) or not row['text'].strip() or len(row['text'])>30000: raise ValueError('Candidate has an invalid or duplicate source relation')
        seen.add(row['sourceAddress'])
        output.append({'sourceRoot':data['source']['ledgerAddress'],'sourceAddress':row['sourceAddress'],'language':language,'template':template['id'],'templateAddress':cid(template),'text':row['text'],'status':'CANDIDATE','requestAddress':request.cid,'candidateAddress':candidate.cid,'unresolved':list(candidate.unresolved),'provenance':'WHY Translate / '+candidate.provider+' / '+candidate.cid,'recordedAt':datetime.now(timezone.utc).isoformat()})
    if seen!=set(by_address): raise ValueError('Candidate does not cover every source verse in the selected chapter')
    return output

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--request',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--source',type=Path,default=Path(__file__).with_name('reader-data.js.gz'))
    parser.add_argument('--ledger',type=Path,default=Path.home()/'.whytranslate'/'ledger.sqlite3')
    parser.add_argument('--scope',choices=('request','book','corpus'),default='request',help='Corpus may make 929 provider requests with --ai')
    parser.add_argument('--ai',action='store_true',help='Explicitly send selected chapters and template to the provider; API charges may apply')
    parser.add_argument('--model',default=None)
    args=parser.parse_args(argv)
    try:
        if args.request.stat().st_size>25*1024*1024: raise ValueError('Request exceeds 25 MiB')
        data=load_source(args.source); payload=json.loads(args.request.read_text(encoding='utf-8-sig'))
        language,template,chapters=select_request(payload,data,args.scope)
        from whytranslate import TranslationLedger,Translator
        provider=None
        if args.ai:
            from whytranslate.openai_provider import OpenAIProvider
            provider=OpenAIProvider(model=args.model)
        result={'protocol':OUTPUT_PROTOCOL,'sourceRoot':data['source']['ledgerAddress'],'records':[],'template':template,'templateAddress':cid(template),'targetLanguage':language,'attempts':[],'boundary':'Generated renderings are candidates; no linguistic or causal equivalence is certified.'}
        args.output.parent.mkdir(parents=True,exist_ok=True)
        with args.output.open('x',encoding='utf-8') as handle: json.dump(result,handle,ensure_ascii=False,indent=2)
        with TranslationLedger(args.ledger) as ledger:
            translator=Translator(ledger,provider)
            for book,chapter in chapters:
                request=make_request(data,book,chapter,language,template)
                observation={'book':book['osisId'],'chapter':chapter['number'],'requestAddress':request.cid,'templateAddress':cid(template)}
                try:
                    returned=translator.translate(request)
                    observation.update(status=returned.status,exact=returned.exact,boundary=list(returned.boundary),candidates=len(returned.candidates))
                    for candidate in returned.candidates:
                        try: result['records'].extend(project_candidate(candidate,request,data,chapter,language,template))
                        except (ValueError,TypeError,KeyError) as error: observation.setdefault('rejectedCandidates',[]).append({'candidateAddress':candidate.cid,'reason':str(error)})
                except Exception as error:
                    observation.update(status='ERROR',error=str(error)); result['attempts'].append(observation)
                    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                    print(json.dumps({'status':'partial','completedChapters':len(result['attempts']),'error':str(error)},ensure_ascii=False)); return 1
                result['attempts'].append(observation)
                args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                print(json.dumps({'book':book['osisId'],'chapter':chapter['number'],'status':returned.status,'records':len(result['records'])},ensure_ascii=False))
        return 0 if result['records'] else 2
    except ImportError:
        print('Install the existing WHY Translate package from Acidfang/LanguageByField. See README.md.',file=sys.stderr); return 1
    except (ValueError,OSError,KeyError,TypeError) as error:
        print(str(error),file=sys.stderr); return 1

if __name__=='__main__': raise SystemExit(main())
