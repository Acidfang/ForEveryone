// Projection only: values and connections remain at their producing addresses.
import {localField,orders} from './field-relations.js';
import {fractureNode} from './recursive-fracture.js';
const turnoverSource='work/chatgpt-gather-2026-09-23/recent-chronology.jsonl#message=1a2f4b1d-35b0-4c45-886c-bdbd53a563d7';
const localTurnSource='work/chatgpt-gather-2026-09-23/recent-chronology.jsonl#line=1184#message=ba4db25f-0108-41f3-afe2-942de6608916';
const pixelDistanceSource='work/chatgpt-gather-2026-09-23/recent-chronology.jsonl#line=2556..2562#messages=c85d60bb-24fb-46a8-9db3-ec2e3d6e864d,81b76d50-a2e0-46e8-b7c9-1e033ba91332,6ea19f9e-088f-4552-a3d7-e64f55e18664';
const pixelCandidateSource='work/chatgpt-gather-2026-09-23/recent-chronology.jsonl#line=2345..2377#messages=2afe5b99-dfdc-4490-95ae-8427c35f9ef3,67ca0a55-9033-4e65-84f4-177f4ff62fa3,1e01016f-22c4-47cb-b43f-1bc635e7bd5c,92e5a821-0a0d-45b1-a089-26516d989ded,bbb21ecd-ddd8-46b1-9749-6a3e18a713d4';
function sharedPointFor(node){
 if(node.sharedPoint)return node.sharedPoint;
 if(node.retainedRelation!=='TIP_TO_CENTRE')return null;
 const match=node.address.match(/\/local-field\/(T[123])\/(WAS|IS|NEXT)$/);
 return match?node.parent+'::shared-point:'+orders[match[1]].indexOf(match[2]):null;
}
export function deriveSelectedMovementStage(nodes,address,selectedAddresses=[]){
 const selected=nodes.find(node=>node.address===address);
 const isRole=node=>node&&(node.retainedRelation==='TIP_TO_CENTRE'||node.retainedRelation==='DERIVED_CYCLIC_ROLE');
 if(selected&&!isRole(selected)){
  const orientation=selected.orientation??address.match(/(?:\/local-field\/|::)(T[123])(?:\/|:)/)?.[1]??null;
  const stageMembers=nodes.filter(node=>selectedAddresses.includes(node.address)&&isRole(node)&&node.parent===selected.parent&&(node.orientation??node.address.match(/(?:\/local-field\/|::)(T[123])(?:\/|:)/)?.[1]??null)===orientation);
  if(stageMembers.length===1)return {...deriveSelectedMovementStage(nodes,stageMembers[0].address,selectedAddresses),observationFocus:address,stageSelectionRelation:'Unique explicitly selected role at the focused gate parent and orientation'};
 }
 const point=selected?sharedPointFor(selected):null;
 const members=point?nodes.filter(node=>sharedPointFor(node)===point):[];
 const roleMember=selected&&(selected.retainedRelation==='TIP_TO_CENTRE'||selected.retainedRelation==='DERIVED_CYCLIC_ROLE');
 const eligible=roleMember&&members.length===3&&members.every(member=>member.address!==address||sharedPointFor(member)===point);
 const orientation=selected?.orientation??address.match(/(?:\/local-field\/|::)(T[123])(?:\/|:)/)?.[1]??null;
 const proceedTarget=eligible?nodes.find(node=>node.parent===selected.parent&&(node.orientation??node.address.match(/(?:\/local-field\/|::)(T[123])(?:\/|:)/)?.[1]??null)===orientation&&(node.retainedRelation==='PROCEED_FROM_CENTRE'||node.retainedRelation==='DERIVED_PROCEED_FROM_CENTRE')):null;
 const signedDirectionCandidates=eligible?nodes.filter(node=>node.parent===selected.parent&&(node.orientation??node.address.match(/(?:\/local-field\/|::)(T[123])(?:\/|:)/)?.[1]??null)===orientation&&(node.signedRelation??(node.retainedRelation?.startsWith('SIGNED_RELATION_')?node.retainedRelation.slice('SIGNED_RELATION_'.length):null))).map(node=>({address:node.address,sign:node.signedRelation??node.retainedRelation.slice('SIGNED_RELATION_'.length)})):[];
 const admittedSelections=signedDirectionCandidates.filter(candidate=>selectedAddresses.includes(candidate.address));
 const directionSelection={
  axisOrigin:selected?.parent??null,
  orientation,
  selected:admittedSelections.length===1?admittedSelections[0]:null,
  selectedFormation:admittedSelections,
  candidates:signedDirectionCandidates,
  status:admittedSelections.length===1?'ADDRESSED_SIGNED_GATE_SELECTED':admittedSelections.length>1?'MULTIPLE_ADDRESSED_SIGNED_GATES_SELECTED':signedDirectionCandidates.length===6?'SIX_SIGNED_RELATIONS_RETAINED_SELECTION_UNRESOLVED':'SIGNED_RELATIONS_INCOMPLETE',
  source:'work/chatgpt-gather-2026-09-23/recent-chronology.jsonl#line=2225#message=1a2f4b1d-35b0-4c45-886c-bdbd53a563d7',
  directionSource:'work/chatgpt-gather-2026-09-23/recent-chronology.jsonl#line=2239#message=64fac6d3-edbd-4de2-8475-8e8a28c55736',
  boundary:'PROCEED retains the orientation-specific target Root and all six signed relations from the same centre. No signed direction is selected until an addressed relation supplies it.'
 };
 const directedTarget=proceedTarget&&directionSelection.selected?{
  proceedAddress:proceedTarget.address,
  signedGateAddress:directionSelection.selected.address,
  sign:directionSelection.selected.sign,
  axisOrigin:selected.parent,
  orientation,
  status:'ADDRESSED_PROCEED_AND_SIGNED_GATE_JOINED_METRIC_ENDPOINT_UNRESOLVED',
  source:turnoverSource,
  boundary:'This joins the role stage, orientation-specific PROCEED Root and explicitly selected signed gate. It does not supply a metric endpoint, target grain or arrival.'
 }:null;
 const roleFormation=eligible?nodes.filter(node=>isRole(node)&&node.parent===selected.parent):[];
 const orientationOf=node=>node.orientation??node.address.match(/(?:\/local-field\/|::)(T[123])(?:\/|:)/)?.[1]??null;
 const movingFormation=roleFormation.filter(node=>orientationOf(node)===orientation).map(node=>node.address);
 const holdingFormations=['T1','T2','T3'].filter(value=>value!==orientation).map(value=>({orientation:value,members:roleFormation.filter(node=>orientationOf(node)===value).map(node=>node.address)}));
 const isOuterMember=isRole(selected)||selected?.retainedRelation==='PROCEED_FROM_CENTRE'||selected?.retainedRelation==='DERIVED_PROCEED_FROM_CENTRE'||selected?.signedRelation||selected?.retainedRelation?.startsWith('SIGNED_RELATION_')||selected?.retainedRelation?.startsWith('DERIVED_SIGNED_RELATION_');
 const continuationCentre=selected?(isOuterMember?selected.parent:nodes.some(node=>node.parent===selected.address&&isRole(node))?selected.address:selected.parent):null;
 const tipContinuations=selected?nodes.filter(node=>node.parent===continuationCentre&&(isRole(node)||node.retainedRelation==='PROCEED_FROM_CENTRE'||node.retainedRelation==='DERIVED_PROCEED_FROM_CENTRE')).map(tip=>({tip:tip.address,centre:tip.parent,orientation:orientationOf(tip),relation:tip.retainedRelation,directions:nodes.filter(gate=>gate.parent===tip.parent&&orientationOf(gate)===orientationOf(tip)&&(gate.signedRelation||gate.retainedRelation?.startsWith('SIGNED_RELATION_'))).map(gate=>({address:gate.address,sign:gate.signedRelation??gate.retainedRelation.slice('SIGNED_RELATION_'.length),selected:selectedAddresses.includes(gate.address)})),status:'ADDRESSED_CONTINUATIONS_RETAINED_STEP_VALIDITY_UNRESOLVED'})):[];
 const formationComplete=eligible&&movingFormation.length===3&&holdingFormations.length===2&&holdingFormations.every(group=>group.members.length===3);
 const centrePassage=eligible?{incomingTips:movingFormation,centre:selected.parent,outgoingTips:movingFormation,proceedTip:proceedTarget?.address??null,addresses:[...movingFormation,selected.parent,...(proceedTarget?[proceedTarget.address]:[])],relations:['TIPS_TO_CENTRE','CENTRE_TO_TIPS'],directionGate:directionSelection.selected?.address??null,status:formationComplete?'PLURAL_CENTRE_PASSAGE_ADDRESSED_NOT_TRAVERSED':'UNRESOLVED_FORMATION_COVERAGE',source:'C:/Users/joera/.codex/sessions/2026/10/04/rollout-2026-10-04T06-15-02-01a102c3-1902-7fd2-b86f-6cc06d28a034.jsonl#line=13271',pluralCorrectionSource:'C:/Users/joera/.codex/sessions/2026/10/04/rollout-2026-10-04T06-15-02-01a102c3-1902-7fd2-b86f-6cc06d28a034.jsonl#line=13282',boundary:'The orientation retains three role-bearing tips around its shared centre and a separate PROCEED tip. Incoming-to-outgoing pairings, movement and arrival are unresolved.'}:null;
 const recursiveFeedback=centrePassage?{
  address:`${address}::addressed-feedback`,
  sourceStage:address,
  returnAddress:address,
  centre:centrePassage.centre,
  proceedAddress:centrePassage.proceedTip,
  directionGateAddress:centrePassage.directionGate,
  adjacentContinuations:tipContinuations.map(tip=>({address:tip.tip,centre:tip.centre,orientation:tip.orientation,relation:tip.relation,returnAddress:address,status:'ADDRESSED_CONTINUATION_NOT_TRAVERSED'})),
  arrivalReceipt:null,targetGrain:null,laterAdvance:false,
  status:formationComplete?'ADDRESSED_PASSAGE_ADJACENCY_AND_RECURSIVE_RETURN_RETAINED_TRAVERSAL_UNRESOLVED':'UNRESOLVED_FORMATION_COVERAGE',
  source:centrePassage.source,
  boundary:'This carries the selected stage through its retained centre, PROCEED target, signed gate and addressed continuations, then retains the selected stage as the recursive return address. It does not pair incoming and outgoing tips, traverse an edge, satisfy lock-in, establish arrival or target grain, or advance a later member.'
 }:null;
 const lockCondition={
  relation:'CURRENT_MEMBER_FORWARD_MOVE_LOCKED_IN_BEFORE_NEXT_ADVANCE',
  currentMovingMember:eligible?address:null,
  targetAddress:proceedTarget?.address??null,
  targetGateAddress:directedTarget?.signedGateAddress??null,
  directedTarget,
  arrivalReceipt:null,
  satisfied:false,
  status:eligible?(directedTarget?'SOURCE_BOUND_DIRECTED_TARGET_RESOLVED_ARRIVAL_RECEIPT_UNRESOLVED':proceedTarget?'SOURCE_BOUND_TARGET_RESOLVED_DIRECTION_AND_ARRIVAL_UNRESOLVED':'SOURCE_BOUND_TARGET_UNRESOLVED'):'UNRESOLVED_SELECTED_MEMBER',
  source:turnoverSource,
  boundary:'Lock-in is the boundary between the current member moving forward through its orientation-specific PROCEED connection and the next member going forward. Without an arrival receipt it is not satisfied.'
 };
 return {
  status:eligible?'DERIVED_SELECTED_STAGE_AWAITING_LOCK':'UNRESOLVED_SELECTED_STAGE',
  stageRoot:address,
  sharedPoint:point,
  tipContinuations,
  centrePassage,
  recursiveFeedback,
  tetrahedronStage:{orientation,movingFormation,holdingFormations,centre:selected?.parent??null,status:formationComplete?'THREE_MOVING_TIPS_AND_TWO_HOLDING_TETRAHEDRA_ADDRESSED':'UNRESOLVED_FORMATION_COVERAGE',source:'work/chatgpt-gather-2026-09-23/refresh-20260930/6ab9a309-dfcc-83ec-958c-5a313c614e80-22.json#message=267d9ef3-57c7-4da4-ad84-21ced0996ff9',boundary:'The selected orientation is the current moving formation; the other two addressed formations hold until lock-in permits the later advance. No arrival or subsequent advance is asserted.'},
  movingMember:eligible?address:null,
  holdingMembers:eligible?members.filter(member=>member.address!==address).map(member=>member.address):null,
  directionSelection,
  pixelCandidates:{
   status:tipContinuations.length?'SOURCE_SELECTED_FRACTURE_PIXEL_CANDIDATES':'NO_ADDRESSED_TIP_CANDIDATES',
   members:tipContinuations.map(tip=>({address:tip.tip,orientation:tip.orientation,relation:tip.relation,screenPixelAddress:null})),
   source:pixelCandidateSource,
   boundary:'Joe identifies each fracture as a pixel candidate, allows distinct positions to resolve to the same pixel, and keeps only the centre static. Candidate membership does not itself establish an actual pixel, metric spacing, movement or arrival.'
  },
  lockCondition,
  lockStatus:lockCondition.status,
  grainTransition:{from:selected?.retainedGrain??selected?.grainTransition?.from??null,to:null,targetAddress:proceedTarget?.address??null,targetGateAddress:directedTarget?.signedGateAddress??null,conditionalTargetGrain:directedTarget?{type:'PIXEL_IF_BOUND_TO_PICTURE_MAP',metricDistance:null,screenPixelAddress:null,status:'SOURCE_BOUND_CONDITIONAL_GRAIN_METRIC_UNRESOLVED',source:pixelDistanceSource,boundary:'Joe selects pixel spacing at the picture/fracture-map projection: if the addressed target is the pixel, a pixel is there. The current source does not supply numeric pixel distance or bind this relational target to an actual screen pixel.'}:null,status:directedTarget?'DIRECTED_TARGET_RESOLVED_CONDITIONAL_GRAIN_BOUND_METRIC_UNRESOLVED':proceedTarget?'TARGET_ADDRESS_RESOLVED_DIRECTION_AND_GRAIN_UNRESOLVED':'TARGET_ADDRESS_AND_GRAIN_UNRESOLVED',source:'work/chatgpt-gather-2026-09-23/recent-chronology.jsonl#line=2230#message=436eb068-2d5c-49ab-a010-80fa4846e099'},
  source:'work/chatgpt-gather-2026-09-23/refresh-20260930/6ab9a309-dfcc-83ec-958c-5a313c614e80-22.json#message=267d9ef3-57c7-4da4-ad84-21ced0996ff9',
  boundary:eligible?'The selected addressed member supplies a derived stage Root: it is the one moving member and the other two identities at its shared point hold. Lock-in requires an addressed target plus an arrival receipt before the next member advances.':'A selected role-bearing shared-point member is required before assigning one moving and two holding members.'
 };
}
export function bindConditionalPixelGrain(stage,screenNodes,width,height){
 const conditional=stage?.grainTransition?.conditionalTargetGrain;
 const targetAddress=stage?.grainTransition?.targetGateAddress??stage?.grainTransition?.targetAddress??null;
 const target=targetAddress?screenNodes.find(node=>node.address===targetAddress):null;
 if(!conditional||!target||!Number.isFinite(target.x)||!Number.isFinite(target.y)||!Number.isFinite(width)||!Number.isFinite(height))return null;
 const x=Math.max(0,Math.min(Math.max(0,Math.trunc(width)-1),Math.round(target.x)));
 const y=Math.max(0,Math.min(Math.max(0,Math.trunc(height)-1),Math.round(target.y)));
 return {
  address:`display/canvas/${Math.trunc(width)}x${Math.trunc(height)}/pixel/${x},${y}`,
  sourceAddress:targetAddress,
  x,y,width:Math.trunc(width),height:Math.trunc(height),
  status:'DERIVED_DISPLAY_PIXEL_BOUND_SOURCE_METRIC_UNRESOLVED',
  source:conditional.source,
  boundary:'This is the current canvas projection pixel for the addressed target. It changes with view, fit and zoom; it does not establish source metric distance, physical screen pixel identity, movement or arrival.'
 };
}
export function bindPixelCandidates(stage,screenNodes,width,height){
 const members=stage?.pixelCandidates?.members??[];
 if(!members.length||!Number.isFinite(width)||!Number.isFinite(height))return {status:'NO_ADDRESSED_TIP_CANDIDATES',candidates:[],groups:[],source:stage?.pixelCandidates?.source??pixelCandidateSource};
 const byAddress=new Map(screenNodes.map(node=>[node.address,node]));
 const candidates=[];
 for(const member of members){const point=byAddress.get(member.address);if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))continue;const x=Math.max(0,Math.min(Math.max(0,Math.trunc(width)-1),Math.round(point.x))),y=Math.max(0,Math.min(Math.max(0,Math.trunc(height)-1),Math.round(point.y)));candidates.push({...member,x,y,screenPixelAddress:`display/canvas/${Math.trunc(width)}x${Math.trunc(height)}/pixel/${x},${y}`});}
 const grouped=new Map();for(const candidate of candidates){if(!grouped.has(candidate.screenPixelAddress))grouped.set(candidate.screenPixelAddress,[]);grouped.get(candidate.screenPixelAddress).push(candidate.address);}
 return {status:'DERIVED_PIXEL_CANDIDATE_PROJECTION',candidates,groups:[...grouped].map(([screenPixelAddress,addresses])=>({screenPixelAddress,addresses})),source:stage.pixelCandidates.source,boundary:'Current canvas projection of source-selected fracture candidates. Multiple candidate addresses may share one rounded canvas pixel; this does not merge their source identities or establish source metric spacing, movement or arrival.'};
}
export function resolveDerivedField(nodes,address){
 let resolved=nodes;const route=[];let current=address;
 while(!resolved.some(node=>node.address===current)){
  const separator=current.lastIndexOf('::');
  if(separator<0)return nodes;
  route.push(current);current=current.slice(0,separator);
 }
 for(const child of route.reverse()){
  resolved=projectDerivedField(resolved,current);
  if(!resolved.some(node=>node.address===child))return nodes;
  current=child;
 }
 return projectDerivedField(resolved,address);
}
export function projectDerivedField(nodes,address){
 const root=nodes.find(node=>node.address===address);
 if(!root||nodes.some(node=>node.parent===address&&node.retainedRelation!=='PREDECESSOR_STATE'))return nodes;
 const field=fractureNode(address,root.retainedGrain??'UNRESOLVED').field;
 const result=[...nodes];
 // Shared role anchors and opposite signed pairs are schematic display choices.
 // Cyclic role order selects the same anchors; it does not displace the centre.
 const anchors=[{x:1,y:1,z:1},{x:-1,y:-1,z:1},{x:-1,y:1,z:-1}];
 const signed=[{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
 for(const [layer,orientation]of field.orientations.entries()){
  const members=[...orientation.roles,...orientation.signedRelations,orientation.proceed];
  for(const [ordinal,member]of members.entries()){
   const offset=ordinal<3?anchors[ordinal]:ordinal===9?{x:1,y:-1,z:-1}:signed[ordinal-3];
   result.push({address:member.address,parent:address,depth:(root.depth??0)+1,
    sharedCentre:address,
    sharedPoint:ordinal<3?address+'::shared-point:'+ordinal:null,
    retainedRelation:member.role?'DERIVED_CYCLIC_ROLE':ordinal===9?'DERIVED_PROCEED_FROM_CENTRE':'DERIVED_SIGNED_RELATION',
    retainedState:member.role??'NO_WAS_IS_NEXT_ROLE',
    orientation:orientation.orientation,
    signedRelation:member.sign??null,
    childKind:'DERIVED_SPATIAL_CHILD',
    chronologicalSuccessor:false,
    producingTransition:{
     relation:member.role?'TIP_TO_CENTRE_SUCCESSOR':ordinal===9?'PROCEED_FROM_CENTRE':'SIGNED_LOCAL_RELATION',
     from:address,to:member.address,
     localTurn:{status:'SOURCE_CONSTRAINED_METRIC_UNRESOLVED',source:localTurnSource},
     orientation:orientation.orientation,
     signedProvenance:member.sign??null
    },
    grainTransition:{from:field.grain,to:null,status:'TARGET_GRAIN_UNRESOLVED',source:localTurnSource},
    retainedGrain:field.grain,derived:true,
    producingRoot:address,producingMechanism:'public/field-relations.js#localField',
    retainedDifference:'Addressed spatial child retains its producing Root, current grain, orientation and signed provenance; target grain and metric local turn remain unresolved.',
    sourceCoordinatePayload:{present:false,coordinateSource:'DERIVED_SHARED_ANCHORS_AND_OPPOSITE_SIGNS; METRIC_UNRESOLVED',sourceRecordAddress:ordinal===9?turnoverSource:'C:/Users/joera/.codex/attachments/ba0c681a-3556-4872-b6d1-340e0a46338c/Pasted text.txt'},
    modelCoordinate:{x:root.modelCoordinate.x+offset.x,y:root.modelCoordinate.y+offset.y,z:root.modelCoordinate.z+offset.z}});
  }
 }
 return result;
}
export function deriveField(nodes, address, selectedAddresses=[]) {
 const record = nodes.find(node => node.address === address);
 if (!record) return {address, unresolved:['Selected address is absent']};
 const children = nodes.filter(node => node.parent === address && node.retainedRelation !== 'PREDECESSOR_STATE').map(node => node.address);
 const chronologicalSuccessors = nodes.filter(node => node.parent === address && node.retainedRelation === 'PREDECESSOR_STATE').map(node => node.address);
 const source = record.sourceCoordinatePayload?.sourceRecordAddress;
 // The selected centre and thread govern grain depth. A chronological history
 // grain and an Earth-centre grain are separately addressed source contexts;
 // this projection's generic graph depth does not establish either value.
 const grainDepth = record.grainDepth ?? null;
 const grainType = record.grainType ?? null;
 const lineage=traceField(nodes,address);
 const sharedPoint=sharedPointFor(record);
 const selectedMovementStage=deriveSelectedMovementStage(nodes,address,selectedAddresses);
 const sharedGroups=new Map();
 for(const tip of selectedMovementStage.tipContinuations){
  const member=nodes.find(node=>node.address===tip.tip),point=member&&sharedPointFor(member);
  if(!point)continue;
  if(!sharedGroups.has(point))sharedGroups.set(point,[]);
  sharedGroups.get(point).push({address:member.address,orientation:tip.orientation,relation:member.retainedRelation});
 }
 const sharedPointGroups={status:'DERIVED_SHARED_POINT_GROUPS',groups:[...sharedGroups].map(([point,members])=>({point,members})),source:'work/chatgpt-gather-2026-09-23/live/6aaf62c8-5464-83ec-9d95-1b230562b0a0/00007.json#message=bbb212c6-1243-4ded-9aee-23a232764dd8',boundary:'Common cyclic member identity; orientation addresses remain distinct. Coordinate coincidence alone does not establish identity, and PROCEED is not merged into a role point.'};
 const sharedRelationships=sharedPoint?{
  status:'DERIVED_SHARED_POINT_RELATION',
  point:sharedPoint,
  centre:record.sharedCentre??record.parent,
  members:nodes.filter(node=>sharedPointFor(node)===sharedPoint).map(node=>({address:node.address,relation:node.retainedRelation})),
  source:'work/chatgpt-gather-2026-09-23/live/6aaf62c8-5464-83ec-9d95-1b230562b0a0/00007.json#message=bbb212c6-1243-4ded-9aee-23a232764dd8',
  boundary:'Shared point identity derives from the common member ordinal in each cyclic order, not coordinate proximity. Further cross-root shared relations remain unresolved.'
 } : null;
 const localFields=deriveLocalRelations(nodes,address);
 const derivedLocalField=localFields.length?{
  zero:address,grain:record.retainedGrain??'UNRESOLVED',orientations:localFields,
  metricTransform:null,metricStatus:'UNRESOLVED: retained connections do not supply a verified metric transform.'
 }:localField(address,record.retainedGrain ?? 'UNRESOLVED');
 const sourceOwner=lineage.backtrace.map(parentAddress=>nodes.find(node=>node.address===parentAddress)).find(node=>node?.sourceEvent);
 const retainedOrientation=record.address.match(/\/local-field\/(T[123])\//)?.[1]??null;
 return {address, selectedRoot:address, parent:record.parent, children, chronologicalSuccessors,
  formBoundary:{
   finalForm:null,
   boundary:'The selected child is its own Root. Retained children describe available connections; their absence does not establish a leaf or final form. Final-form admission requires its producing source.'
  },
  relation:record.retainedRelation ?? null,
  role:record.retainedState??null,
  orientation:record.orientation??retainedOrientation,
  signedRelation:record.signedRelation??(record.retainedRelation?.startsWith('SIGNED_RELATION_')?record.retainedRelation.slice('SIGNED_RELATION_'.length):null),
  grainTransition:record.grainTransition??null,
  selectedMovementStage,
  roleTurnover:{
   source:turnoverSource,
   succession:[{was:'NEXT',next:'IS'},{was:'IS',next:'WAS'},{was:'WAS',next:'NEXT'}],
   selectedRole:record.retainedState??null,
   proposedRole:null,
   laterSource:'work/chatgpt-gather-2026-09-23/recent-chronology.jsonl#line=2228#message=267d9ef3-57c7-4da4-ad84-21ced0996ff9',
   stepResolution:null,
   movementConstraint:{
    status:'SOURCE_CONSTRAINED_STAGE_UNRESOLVED',
    source:'work/chatgpt-gather-2026-09-23/refresh-20260930/6ab9a309-dfcc-83ec-958c-5a313c614e80-22.json#message=267d9ef3-57c7-4da4-ad84-21ced0996ff9',
    movingMember:selectedMovementStage.movingMember,
    holdingMembers:selectedMovementStage.holdingMembers,
    constraint:'One tetrahedron turns while two hold their place; the not-yet-moved member advances later.',
    advanceBoundary:'The preceding source requires lock-in before the next advance.',
    boundary:'These are retained movement constraints, not an executed stage or a simultaneous permutation of every member.'
   },
   lockCondition:selectedMovementStage.lockCondition,
   proceedDirection:null,
   boundary:'The earlier cycle remains retained. The later source describes staggered movement and IS becoming NEXT; its stage and point of view must be joined before assigning this selected member a next role. No observed lock, executed advance or metric direction is established.'
  },
  retainedGrain:record.retainedGrain ?? null, grainDepth, grainType,
  grainDerivation:{
   centreAddress:address,
   definition:'grain depth = how many grains until the center is reached to the grain it can be seen as',
   source:'C:/Users/joera/.codex/sessions/2026/10/04/rollout-2026-10-04T06-15-02-01a102c3-1902-7fd2-b86f-6cc06d28a034.jsonl#line=2378#message=msg_01a1032f-2cd1-7bd1-9718-854673ffc561',
   value:grainDepth,
   boundary:'For this selected spatial centre, depth requires its addressed grain transitions and counting origin. Chronological depth may supply grain depth in the retained history view; it is not automatically the spatial-centre measurement.'
  },
  chronologicalTransition:record.chronologicalTransition ?? null,
  coordinateDerivation:{
   sourceCoordinatePresent:record.sourceCoordinatePayload?.present ?? null,
   coordinateSource:record.sourceCoordinatePayload?.coordinateSource ?? null,
   sourceRecordAddress:record.sourceCoordinatePayload?.sourceRecordAddress ?? null,
   projectionCoordinate:record.modelCoordinate ?? null
  },
  backtrace:lineage.backtrace, replay:lineage.replay,
  localFields,
  sharedRelationships,
  sharedPointGroups,
  derivedLocalField:{
   status:localFields.length?'RETAINED_CONNECTED_FORM':'DERIVED_RELATIONAL_FORM',
   root:address,
   pixelProjection:{
    status:'SOURCE_SELECTED_POSSIBLE_PIXEL',
    source:'C:/Users/joera/.codex/sessions/2026/09/25/rollout-2026-09-25T09-01-51-01a0d539-84f3-78b2-beea-676838af6c8b.jsonl#line=13801#realtime_delegation/input',
    screenPixelAddress:null,
    adjacentFieldAddress:null,
    boundary:'The source describes each neighbouring tetrahedron as a possible pixel. Actual screen-pixel binding and the addressed neighbour transition remain unresolved; display proximity does not supply them.'
   },
   returnAddress:record.parent ?? null,
   producingMechanism:localFields.length?'public/field-derivation.js#deriveLocalRelations':'public/field-relations.js#localField',
   retainedSource:'C:/Users/joera/.codex/attachments/ba0c681a-3556-4872-b6d1-340e0a46338c/Pasted text.txt',
   formation:derivedLocalField,
   boundary:localFields.length?'Existing member addresses resolved directly at the selected Root; no alternate member routes generated. Metric geometry remains unresolved.':'Derived at the selected Root using the retained shared-centre cyclic relation. These role addresses are a derived form, not additional recorded occurrences or verified metric geometry.'
  },
  difference:record.retainedDifference ?? null, source:source ?? null,
  sourceEvent:sourceOwner?.sourceEvent ?? null,
  sourceEventOwner:sourceOwner?.address ?? null,
  temporalAccount:sourceOwner?.sourceEvent?.account ?? null,
  chronologicalMoment:sourceOwner?.sourceEvent ? {
   attribution:sourceOwner.address===address?'STATE_OCCURRENCE':'CONTAINING_STATE_OCCURRENCE',
   occurrenceId:sourceOwner.sourceEvent.event.occurrenceId,
   recordedAt:sourceOwner.sourceEvent.event.recordedAt ?? null,
   parentState:sourceOwner.sourceEvent.event.parentState ?? null,
   resultState:sourceOwner.sourceEvent.event.resultState,
   sourceAddress:sourceOwner.sourceEvent.address,
   fractureSourceAddress:source ?? null,
   historicalFractureVerification:null,
   boundary:'Retained occurrence order and recorded date. A local-field projection belongs to this State; its separate reconstruction source does not prove that this rendered fracture existed at that historical Moment. No finer timestamp or spatial grain inferred.'
  } : null,
  unresolved:[...(lineage.unresolved?[lineage.unresolved]:[]),...(!source?['Producing source address']:[]),
   ...(grainDepth===null?['Grain depth to the selected centre']:[]),
   ...(grainType===null?['Grain type']:[])]};
}

export function deriveLocalRelations(nodes,address) {
 const groups=new Map();
 for(const child of nodes){
  if(child.parent!==address)continue;
  const suffix=child.address.slice(address.length);
  const match=suffix.match(/^\/local-field\/(T[123])\//);
  if(!match)continue;
  const orientation=match[1];
  if(!groups.has(orientation))groups.set(orientation,{orientation,centre:address,axisOrigin:address,roles:[],signedRelations:[],proceed:[]});
  const group=groups.get(orientation);
  const relation={address:child.address,relation:child.retainedRelation??null,state:child.retainedState??null,grain:child.retainedGrain??null,source:child.sourceCoordinatePayload?.sourceRecordAddress??null};
  if(child.retainedRelation==='TIP_TO_CENTRE')group.roles.push(relation);
  else if(child.retainedRelation?.startsWith('SIGNED_RELATION_'))group.signedRelations.push(relation);
  else if(child.retainedRelation==='PROCEED_FROM_CENTRE')group.proceed.push(relation);
 }
 return [...groups.values()];
}

export function traceField(nodes,address) {
 const index=new Map(nodes.map(node=>[node.address,node]));
 const visited=new Set(),backtrace=[];
 let current=address,unresolved=null;
 while(current&&current!=='NONE'){
  if(visited.has(current)){unresolved='Circular parent relation at '+current;break;}
  visited.add(current);
  const node=index.get(current);
  if(!node){unresolved='Missing parent record at '+current;break;}
  backtrace.push(current);current=node.parent;
 }
 return {backtrace,replay:[...backtrace].reverse(),unresolved};
}

export function selectLocalField(nodes,address){
 const admitted=new Set([address]);let changed;
 do{changed=false;for(const node of nodes){
  // A later State is a chronological successor, not a spatial child
  // of the selected Moment. It remains reachable through Moment navigation.
  if(node.retainedRelation==='PREDECESSOR_STATE')continue;
  if(admitted.has(node.parent)&&!admitted.has(node.address)){admitted.add(node.address);changed=true;}
 }}while(changed);
 return nodes.filter(node=>admitted.has(node.address));
}
