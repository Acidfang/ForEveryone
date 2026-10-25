export const orders=Object.freeze({
 T1:Object.freeze(['WAS','IS','NEXT']),
 T2:Object.freeze(['NEXT','WAS','IS']),
 T3:Object.freeze(['IS','NEXT','WAS'])
});
export function localField(address,grain){if(typeof address!=='string'||!address||typeof grain!=='string'||!grain)throw Error('Address and grain required');return {zero:address,grain,orientations:Object.entries(orders).map(([orientation,roles])=>({orientation,centre:address,axisOrigin:address,proceed:{address:address+'::'+orientation+':PROCEED',origin:address,grain,role:null,relation:'PROCEED_FROM_CENTRE'},roles:roles.map((role,ordinal)=>({address:address+'::'+orientation+':'+role,role,ordinal,origin:address,grain})),signedRelations:['+X','-X','+Y','-Y','+Z','-Z'].map(sign=>({address:address+'::'+orientation+':'+sign,orientation,sign,origin:address,grain}))})),metricTransform:null,metricStatus:'UNRESOLVED: role ordering alone does not supply a verified metric transform.'}}
export function backtrace(records,address){
 const byAddress=new Map();
 for(const record of records){
  if(typeof record.resultState!=='string'||!record.resultState)throw Error('Result state required');
  if(byAddress.has(record.resultState))throw Error('Duplicate result state '+record.resultState);
  byAddress.set(record.resultState,record);
 }
 const seen=new Set(),chain=[];let current=address;
 while(current){
  if(seen.has(current))throw Error('Cyclic lineage');
  seen.add(current);
  const record=byAddress.get(current);
  if(!record)throw Error('Missing predecessor '+current);
  chain.push(record);current=record.parentState;
 }
 return chain.reverse();
}

/**
 * Source-bound Truth triad for finite JSON data. Replay agreement is bounded
 * evidence, not proof of independent implementation or universal truth.
 * Each callback receives its own immutable snapshot; outputs are captured
 * before the other callback runs. Missing/unsupported values stay unresolved.
 */
function truthSnapshot(value){
 const active=new Set();let remaining=100000;
 const copy=value=>{
  if(--remaining<0)throw Error('Truth value exceeds bounded snapshot size');
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Non-finite truth value');return value;}
  if(typeof value!=='object')throw Error('Missing or unsupported truth value');
  if(active.has(value))throw Error('Cyclic truth value');
  const array=Array.isArray(value),prototype=Object.getPrototypeOf(value);
  if(!array&&prototype!==Object.prototype&&prototype!==null)throw Error('Truth value must be plain data');
  active.add(value);
  const out=array?[]:Object.create(null);
  const keys=Reflect.ownKeys(value);
  if(array&&(keys.length!==value.length+1||!keys.includes('length')))throw Error('Sparse or extended truth array');
  for(const key of keys){
   if(array&&key==='length')continue;
   if(typeof key!=='string'||(array&&!/^(0|[1-9]\d*)$/.test(key)))throw Error('Unsupported truth property');
   const descriptor=Object.getOwnPropertyDescriptor(value,key);
   if(!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))throw Error('Truth data accessors or hidden properties unsupported');
   out[key]=copy(descriptor.value);
  }
  active.delete(value);return Object.freeze(out);
 };
 return copy(value);
}
function truthIdentity(value){
 if(typeof value==='number'&&Object.is(value,-0))return '-0';
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(truthIdentity).join(',')+']';
 return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+truthIdentity(value[key])).join(',')+'}';
}
export function resolveFilterTruth({address,source,observation,derive,reproduce,assumptions,expected}={}){
 if(typeof address!=='string'||!address.trim())throw Error('Filter address required');
 if(typeof source!=='string'||!source.trim())throw Error('Observation source required');
 if(!Array.isArray(assumptions))throw Error('Explicit assumptions array required (may be empty)');
 const receipt={address,source,observation:null,assumptions:[],expected:null,
  derived:null,reproduced:null,status:'UNRESOLVED',difference:null,
  relation:'OBSERVATION_DERIVATION_REPRODUCIBILITY',
  boundary:'Finite plain-data snapshots; separate replay inputs do not establish independent code, observation or universal truth.'};
 try{
  receipt.assumptions=truthSnapshot(assumptions);
  if(expected!==undefined)receipt.expected=truthSnapshot(expected);
  if(observation!==undefined)receipt.observation=truthSnapshot(observation);
  if(observation===undefined||typeof derive!=='function'||typeof reproduce!=='function'){
   receipt.difference='MISSING_OBSERVATION_OR_DERIVATION_OR_REPLAY';return receipt;
  }
  receipt.derived=truthSnapshot(derive(truthSnapshot(receipt.observation)));
  receipt.reproduced=truthSnapshot(reproduce(truthSnapshot(receipt.observation)));
  const same=truthIdentity(receipt.derived)===truthIdentity(receipt.reproduced);
  const expectedMatch=expected===undefined||truthIdentity(receipt.derived)===truthIdentity(receipt.expected);
  receipt.status=same&&expectedMatch?'REPRODUCED_WITHIN_STATED_BOUNDARY':'DIFFERENCE';
  if(receipt.status==='DIFFERENCE')receipt.difference={derived:receipt.derived,reproduced:receipt.reproduced,expected:receipt.expected};
 }catch(error){receipt.difference={error:String(error?.message??error)};}
 return receipt;
}
export const truthFilterKeys=Object.freeze([
 'game','player','starting-points','matches','legs','checkouts',
 'scoring','efficiency','phases','history','field-relations',
 'recursive-fracture','field-derivation','models','rendering'
]);
export function resolveAllFilterTruth({root='preview/first-frame',source,evidence={}}={}){
 if(typeof root!=='string'||!root.trim())throw Error('Root address required');
 if(typeof source!=='string'||!source.trim())throw Error('Source required');
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence))throw Error('Filter evidence record required');
 const receipts={};
 for(const key of truthFilterKeys){
  const entry=Object.hasOwn(evidence,key)?evidence[key]:null,address=root+'/'+key;
  if(!entry){
   receipts[key]={address,source,observation:null,assumptions:[],expected:null,
    derived:null,reproduced:null,status:'UNRESOLVED',difference:'NO_SOURCE_BOUND_OBSERVATION',
    relation:'OBSERVATION_DERIVATION_REPRODUCIBILITY'};continue;
  }
  receipts[key]=resolveFilterTruth({address,source:entry.source??source,
   observation:entry.observation,assumptions:entry.assumptions,derive:entry.derive,
   reproduce:entry.reproduce,expected:entry.expected});
 }
 return {root,source,receipts,coverage:truthFilterKeys.length,
  verified:Object.values(receipts).filter(r=>r.status==='REPRODUCED_WITHIN_STATED_BOUNDARY').length,
  unresolved:Object.values(receipts).filter(r=>r.status==='UNRESOLVED').length,
  differences:Object.values(receipts).filter(r=>r.status==='DIFFERENCE').length,
  boundary:'A shared admission contract; consumer integration and live execution require separate receipts.'};
}
