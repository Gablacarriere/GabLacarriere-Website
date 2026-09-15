(() => {
'use strict';
const root=document.getElementById('teachingWorkbench');
if(!root||root.dataset.tool!=='session-planner')return;
const CURR=window.GAB_CURRICULUM,LINKS=window.GAB_CURRICULUM_LINKS;
let optimizing=false,scheduled=false;

const fieldValue=name=>root.querySelector(`[data-field="${name}"]:not([data-activity])`)?.value?.trim()||'';
const selectedConceptIds=()=>[...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(x=>x.dataset.concept);
const selectedDance=()=>fieldValue('dance')||'zouk';
const sessionDuration=()=>Math.max(1,Number(fieldValue('duration')||60));
const recommendedMinutes=()=>{const d=sessionDuration();return d<=60?{general:4,specific:6,cool:3}:d<=90?{general:5,specific:7,cool:4}:{general:6,specific:8,cool:5};};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function rows(){
 return [...root.querySelectorAll('[data-activity][data-field="title"]')].map((title,index)=>{
  const id=title.dataset.activity;
  return {id,index,title:title.value||'',titleEl:title,minutesEl:root.querySelector(`[data-activity="${id}"][data-field="minutes"]`),instructionsEl:root.querySelector(`[data-activity="${id}"][data-field="instructions"]`)};
 });
}
function setInput(el,value){if(!el)return;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));}
function findRow(test){return rows().find(r=>test(r.title));}
function has(test){return !!findRow(test);}

function graphPreparation(){
 const targets=selectedConceptIds();
 if(!CURR||!targets.length)return {targets:[],supports:[],practice:[]};
 const supports=CURR.prerequisites(targets,{recursive:false,track:selectedDance()});
 const seen=new Set(),practice=[];
 if(LINKS){for(const cid of [...supports.map(x=>x.id),...targets])for(const link of LINKS.forConcept(cid)||[]){if(seen.has(link.skill))continue;seen.add(link.skill);practice.push(link);}}
 return {targets:targets.map(id=>CURR.concept(id)).filter(Boolean),supports,practice};
}
function focusLabel(){
 const graph=graphPreparation();
 if(graph.targets.length)return graph.targets.slice(0,2).map(x=>x.name).join(' + ');
 const goal=fieldValue('goal');return goal?goal.slice(0,70):'today’s main movement';
}
function lessonText(){
 const labels=[...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(x=>x.closest('label')?.innerText||'');
 return [fieldValue('title'),fieldValue('goal'),fieldValue('prerequisites'),fieldValue('rhythm'),...labels].join(' ').toLowerCase();
}
function optimizedSpecificInstructions(){
 const text=lessonText(),graph=graphPreparation(),steps=[];
 if(/head|neck|cervical|chicote|boneca|tilt/.test(text))steps.push('Thoracic/scapular organization → active neck control in a small comfortable range → small head pathways → gradually approach the lesson amplitude and speed; keep a neutral-head option.');
 if(/cambre|cambré|backbend|extension/.test(text))steps.push('Hip/thoracic mobility → trunk and glute support → small active extension → controlled return → only then approach the lesson range.');
 if(/turn|axis|counterbalance|balance|pivot|rotation/.test(text))steps.push('Foot/ankle articulation → balance and complete weight transfer → place-transfer-rotate → partial turns → lesson-speed turning.');
 if(/connection|frame|elastic|lead|follow|distance/.test(text))steps.push('Scapular organization and arm freedom → light tone calibration → small partner signals → the same communication inside the lesson pathway.');
 if(/timing|rhythm|musical|count|tempo|pulse/.test(text))steps.push('Find the pulse → step the timing → preserve complete weight transfer → vary tempo/subdivision → add the lesson movement without losing timing.');
 if(/torsion|dissociation|spiral|chest|rib|pelvis/.test(text))steps.push('Separate pelvis/ribcage motion → small thoracic rotation → add weight transfer → increase spiral only while control survives.');
 if(/lambada|saltinho/.test(text))steps.push('Compact continuous steps → ankle/hip elasticity → count and directional completion → small diagonal/rotational pathways at Lambada scale.');
 if(!steps.length)steps.push('Rehearse the easiest component first, use a smaller/slower range, then add coordination and progressively approach the lesson version.');
 const lines=[`Prepare exactly what the lesson will demand. ${steps.slice(0,2).join(' ')}`,'Progression: simple → complex; small → required range; slow → lesson speed; predictable → variable; solo → partner when relevant.'];
 if(graph.supports.length)lines.push('Atlas supports to prepare first: '+graph.supports.map(x=>x.name).join(', ')+'.');
 if(graph.practice.length)lines.push('Related Zoukable practice areas: '+graph.practice.slice(0,5).map(x=>x.name).join(', ')+'.');
 lines.push('Why: the specific warm-up should function as the first learning progression, not as unrelated exercise.');
 return lines.join('\n');
}

async function moveTo(id,target){
 for(let guard=0;guard<120;guard++){
  const current=rows(),index=current.findIndex(r=>r.id===id);if(index<0||index===target)return;
  const action=index>target?'activityUp':'activityDown';
  const button=root.querySelector(`[data-action="${action}"][data-id="${id}"]`);if(!button||button.disabled)return;
  button.click();await wait(0);
 }
}
async function moveToEnd(id){
 for(let guard=0;guard<120;guard++){
  const current=rows(),index=current.findIndex(r=>r.id===id);if(index<0||index===current.length-1)return;
  const button=root.querySelector(`[data-action="activityDown"][data-id="${id}"]`);if(!button||button.disabled)return;
  button.click();await wait(0);
 }
}
async function ensureSections(){
 const missing=!has(t=>/^general warm-up/i.test(t))||!has(t=>/^specific warm-up/i.test(t))||!has(t=>/^cool-down/i.test(t));
 if(!missing)return;
 const all=root.querySelector('[data-prep="all"]');if(all){all.click();await wait(40);return;}
 for(const action of ['general','specific','cool']){const b=root.querySelector(`[data-prep="${action}"]`);if(b&&!b.disabled){b.click();await wait(20);}}
}
async function normalizeStructure(){
 await ensureSections();
 let general=findRow(t=>/^general warm-up/i.test(t));
 let mainSpecific=findRow(t=>/^specific warm-up(?! drill)/i.test(t));
 let cool=findRow(t=>/^cool-down/i.test(t));
 if(general)await moveTo(general.id,0);
 mainSpecific=findRow(t=>/^specific warm-up(?! drill)/i.test(t));
 if(mainSpecific)await moveTo(mainSpecific.id,general?1:0);
 const specificDrills=rows().filter(r=>/^specific warm-up drill/i.test(r.title));
 let target=(general?1:0)+(mainSpecific?1:0);
 for(const drill of specificDrills){await moveTo(drill.id,target);target++;}
 cool=findRow(t=>/^cool-down/i.test(t));if(cool)await moveToEnd(cool.id);
}
function normalizeGeneratedContent(){
 const mins=recommendedMinutes();
 const general=findRow(t=>/^general warm-up/i.test(t));
 const specific=findRow(t=>/^specific warm-up(?! drill)/i.test(t));
 const cool=findRow(t=>/^cool-down/i.test(t));
 if(general)setInput(general.minutesEl,mins.general);
 if(specific){setInput(specific.minutesEl,mins.specific);setInput(specific.titleEl,'Specific Warm-up — '+focusLabel());setInput(specific.instructionsEl,optimizedSpecificInstructions());}
 if(cool)setInput(cool.minutesEl,mins.cool);
}
function preparationMinutes(){return rows().filter(r=>/^general warm-up|^specific warm-up/i.test(r.title)).reduce((n,r)=>n+Number(r.minutesEl?.value||0),0);}
function status(message){const out=document.querySelector('.prepStatus')||document.getElementById('toolStatus');if(out)out.textContent=message;}
async function optimize(){
 if(optimizing)return;optimizing=true;
 const button=root.querySelector('[data-optimize-prep]');if(button){button.disabled=true;button.textContent='Optimizing…';}
 try{
  await normalizeStructure();
  normalizeGeneratedContent();
  await wait(50);
  const prep=preparationMinutes(),d=sessionDuration(),share=Math.round(prep/d*100);
  const customWarmups=rows().filter(r=>/^specific warm-up drill/i.test(r.title)).length;
  status(`Preparation optimized: General → Specific → lesson → Cool-down. Core section timing was normalized. ${prep} of ${d} minutes (${share}%) are currently preparation${customWarmups?`; ${customWarmups} custom warm-up drill${customWarmups===1?'':'s'} preserved`:''}.`);
 }finally{optimizing=false;await wait(20);installButton();}
}
function installButton(){
 if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{
  scheduled=false;
  const actions=root.querySelector('.prepAuditActions');if(!actions||actions.querySelector('[data-optimize-prep]'))return;
  const button=document.createElement('button');button.type='button';button.className='toolPrimary';button.dataset.optimizePrep='1';button.textContent='Optimize preparation structure';
  button.addEventListener('click',optimize);actions.prepend(button);
  const note=document.createElement('small');note.className='toolHint';note.textContent='Reorders preparation, refreshes the generated specific warm-up from the current lesson target, and normalizes core section timing. Your custom drills are preserved.';actions.insertAdjacentElement('afterend',note);
 });
}
new MutationObserver(installButton).observe(root,{childList:true,subtree:true});
root.addEventListener('change',event=>{if(event.target.dataset.concept||event.target.dataset.skill||event.target.matches('select[data-field="dance"]'))installButton();});
installButton();
})();