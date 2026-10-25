import {localField} from './field-relations.js';

// One retained fracture rule applies at every local zero. Recursion is stored as
// a grammar reference, not an ever-growing copy of the same addressed subtree.
export function fractureNode(address,grain){
 const field=localField(address,grain);
 return {address,grain,centre:address,field,threads:field.orientations.flatMap(layer=>[
  ...layer.roles.map(member=>({from:address,to:member.address,orientation:layer.orientation,relation:member.role,ordinal:member.ordinal})),
  ...layer.signedRelations.map(member=>({from:address,to:member.address,orientation:layer.orientation,relation:member.sign})),
  {from:address,to:layer.proceed.address,orientation:layer.orientation,relation:layer.proceed.relation}
 ]),continuation:{operation:'fractureNode',at:'EVERY_THREAD_TARGET',grain},metricTransform:field.metricTransform};
}
function relativePattern(node){return JSON.stringify(node.threads.map(thread=>({
 target:thread.to.slice(node.address.length),orientation:thread.orientation,relation:thread.relation,ordinal:thread.ordinal??null
})));}
export function recursiveFracture(root,grain){
 const first=fractureNode(root,grain),pattern=relativePattern(first);
 const checks=first.threads.map(thread=>{
  const child=fractureNode(thread.to,grain);
  return {address:child.address,parent:root,patternRepeated:relativePattern(child)===pattern,
   centreIsPreviousTip:child.centre===thread.to,threads:child.threads.length};
 });
 return {root,grain,operation:'UNIFORM_RECURSIVE_FRACTURE',template:first,
  recurrence:{templateRoot:root,at:'EVERY_THREAD_TARGET',retainAddressPath:true,
   stoppingRule:'Address-relative fracture pattern repeats at every child; retain ongoing recursion as a template reference',
   verified:checks.every(check=>check.patternRepeated&&check.centreIsPreviousTip)},checks,
  boundary:'Recurrence of the retained localField rule, not proof that this rule exhausts all source fractures or supplies a metric twist law.'};
}
export function resolveFracturePath(root,grain,selectors){
 let address=root;const passages=[];
 for(const selector of selectors){const node=fractureNode(address,grain);
  const thread=node.threads.find(t=>t.to===address+'::'+selector);
  if(!thread)throw Error('Unretained fracture selector: '+selector);
  passages.push(thread);address=thread.to;
 }
 return {root,address,passages,node:fractureNode(address,grain)};
}
