(() => {
'use strict';
const root=document.getElementById('teachingWorkbench');
if(!root||root.dataset.tool!=='session-planner')return;
let scheduled=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const DEMAND_IDS={'Range of motion':'range','Balance & axis':'axis','Coordination':'coordination','Speed / acceleration':'speed','Partner interaction':'partner','Rhythm / timing':'rhythm','Support / load':'load','Attention / decision load':'attention'};
const MATCH={
 range:/range|mobility|circle|rotation|extension|flexion|neck|head|thoracic|hip|shoulder|spiral|cambre|cambré|tilt/,
 axis:/balance|axis|weight transfer|foot|feet|ankle|landing|single leg|turn|pivot|center|counterbalance/,
 coordination:/coordina|layer|sequence|dissociation|isolation|head|turn|step|pathway|combine|torsion/,
 speed:/speed|tempo|quick|fast|acceleration|deceler|double|chicote|whip/,
 partner:/partner|connection|frame|lead|follow|contact|tone|elastic|signal|distance/,
 rhythm:/rhythm|timing|count|pulse|beat|tempo|bpm|music|phrase/,
 load:/support|resistance|active|strength|trunk|core|glute|counterbalance|elastic|control|isometric|leverage/,
 attention:/choice|respond|notice|observe|variable|decision|feedback|change|partner|timing|attention|predictable/
};
const RULES={
 range:{label:'Range of motion',easy:'Use a smaller comfortable active range or a more supported position. Keep the pathway recognizable.',challenge:'Approach only the range required by the lesson while preserving control and an easy return; do not chase maximum range.'},
 axis:{label:'Balance & axis',easy:'Increase stability: use two-foot support, slower transfers or a clearer landing checkpoint.',challenge:'Reduce external stability by adding a single-leg checkpoint, small displacement or rotation while keeping the same pathway.'},
 coordination:{label:'Coordination',easy:'Remove one layer. Keep only the essential feet/weight or torso pathway until it is repeatable.',challenge:'Add exactly one coordination layer—such as torso, arms, timing or partner information—without changing the other variables.'},
 speed:{label:'Speed / acceleration',easy:'Perform the same task below lesson speed with pauses at useful checkpoints.',challenge:'Move closer to lesson speed only if shape, timing and control stay unchanged. Do not use all-out speed.'},
 partner:{label:'Partner interaction',easy:'Reduce partner information: work solo, use fixed contact, or use one predictable signal.',challenge:'Add one partner variable—direction, entry, contact change or partner response—while keeping the movement demand otherwise stable.'},
 rhythm:{label:'Rhythm / timing',easy:'Use one clear count or pulse with a familiar step and no tempo change.',challenge:'Keep the same movement while adding one timing change, subdivision or tempo variation.'},
 load:{label:'Support / load',easy:'Reduce leverage, resistance or shared load. Prefer self-supported or lighter-control versions.',challenge:'Increase leverage or shared load only slightly and only while active support and return control remain clear.'},
 attention:{label:'Attention / decision load',easy:'Make the task predictable and give one observable cue only.',challenge:'Add one decision or variability source while keeping the physical task unchanged.'}
};
function demandProfile(){
 const map=document.getElementById('movementDemandMap');if(!map)return [];
 return [...map.querySelectorAll('.demandItem')].map(card=>{const label=card.querySelector('h4')?.textContent?.trim()||'',meta=card.querySelector('.demandMeta')?.textContent?.toLowerCase()||'',id=DEMAND_IDS[label];if(!id)return null;const score=meta.includes('high')?3:meta.includes('moderate')?2:1;return {id,label,score};}).filter(Boolean).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
}
function isSpecific(title){return /^specific warm-up/i.test(title||'');}
function cleanInstructions(value){return String(value||'').replace(/\n*— Generated variation: (?:Easier|Challenge) —[\s\S]*?— End generated variation —\n*/g,'\n').trim();}
function rows(){
 return [...root.querySelectorAll('[data-activity][data-field="title"]')].map(title=>{const id=title.dataset.activity,row=title.closest('.toolRow'),minutes=root.querySelector(`[data-activity="${id}"][data-field="minutes"]`),instructions=root.querySelector(`[data-activity="${id}"][data-field="instructions"]`);return {id,title:title.value||'',row,titleEl:title,minutesEl:minutes,instructionsEl:instructions};}).filter(x=>x.row&&x.instructionsEl&&isSpecific(x.title));
}
function primaryDemand(activity){
 const text=normalize(activity.title+' '+cleanInstructions(activity.instructionsEl.value));
 const profile=demandProfile();
 let candidates=profile.filter(d=>d.score>=2&&MATCH[d.id]?.test(text));
 if(!candidates.length)candidates=profile.filter(d=>d.score>=2);
 if(!candidates.length)candidates=profile;
 let chosen=candidates[0]||{id:'coordination',label:'Coordination',score:2};
 const head=/head|neck|cervical|boneca|chicote|tilt|cambr[eé]/.test(text);
 if(head&&(chosen.id==='speed'||chosen.id==='range')){
   chosen=candidates.find(d=>d.id==='coordination')||candidates.find(d=>d.id==='attention')||candidates.find(d=>d.id==='partner')||{id:'coordination',label:'Coordination',score:2};
 }
 return chosen;
}
function standardSummary(activity){
 const base=cleanInstructions(activity.instructionsEl.value).replace(/\s+/g,' ').trim();
 return base?base.slice(0,220)+(base.length>220?'…':''):'Keep the teacher’s current version unchanged.';
}
function variationText(mode,demand){
 const rule=RULES[demand.id]||RULES.coordination;
 const task=mode==='easy'?rule.easy:rule.challenge;
 const label=mode==='easy'?'Easier':'Challenge';
 return `— Generated variation: ${label} —\nAdjusted demand: ${rule.label}\nTask: ${task}\nRule: change this one demand first; keep the other lesson variables as close to the standard version as possible.\n— End generated variation —`;
}
function appliedMode(activity){const value=activity.instructionsEl.value||'';if(/— Generated variation: Easier —/.test(value))return'easy';if(/— Generated variation: Challenge —/.test(value))return'challenge';return'standard';}
function installStyle(){
 if(document.getElementById('progression-ladder-style'))return;
 const s=document.createElement('style');s.id='progression-ladder-style';s.textContent=`
 .progressionLadder{margin:10px 0 0;padding:12px;border:1px solid #7dd8ff30;border-radius:13px;background:#0d151e}.progressionLadder h4{margin:0 0 5px}.progressionLadder>p{margin:5px 0;color:#c8cfda}.progressionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.progressionCard{padding:11px;border:1px solid #ffffff1b;border-radius:11px;background:#101923}.progressionCard.isActive{border-color:#7dd8ff77;background:#10202c}.progressionCard h5{margin:0 0 5px;font-size:.92rem}.progressionCard p{margin:5px 0;color:#c8cfda;font-size:.84rem}.progressionDemand{font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;color:#91ddff}.progressionCard button{margin-top:7px}.progressionNote{font-size:.78rem!important;color:#aeb9c5!important}@media(max-width:800px){.progressionGrid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}
function signature(activity,demand){return [activity.title,cleanInstructions(activity.instructionsEl.value),demand.id,demand.score,appliedMode(activity)].join('|');}
function renderActivity(activity){
 const demand=primaryDemand(activity),sig=signature(activity,demand);let panel=activity.row.querySelector(':scope > .progressionLadder');
 if(!panel){panel=document.createElement('section');panel.className='progressionLadder';activity.row.querySelector('.toolRowActions')?.before(panel);}
 if(panel.dataset.signature===sig)return;panel.dataset.signature=sig;
 const rule=RULES[demand.id]||RULES.coordination,mode=appliedMode(activity),head=/head|neck|cervical|boneca|chicote|tilt|cambr[eé]/.test(normalize(activity.title+' '+activity.instructionsEl.value));
 panel.innerHTML=`<p class="kicker">PROGRESSION & REGRESSION</p><h4>One exercise, three levels</h4><p>Primary adjustable demand: <strong>${esc(rule.label)}</strong>. Change one variable first so you can tell what actually helped.</p>${head?'<p class="progressionNote">Head/neck-related work uses coordination or attention as the challenge variable rather than simply prescribing more neck range or speed.</p>':''}<div class="progressionGrid"><article class="progressionCard ${mode==='easy'?'isActive':''}"><div class="progressionDemand">Easier · reduce ${esc(rule.label.toLowerCase())}</div><h5>Regression</h5><p>${esc(rule.easy)}</p><button type="button" data-progression-mode="easy" data-activity-id="${esc(activity.id)}">${mode==='easy'?'Using easier version':'Use easier version'}</button></article><article class="progressionCard ${mode==='standard'?'isActive':''}"><div class="progressionDemand">Standard · teacher version</div><h5>Current exercise</h5><p>${esc(standardSummary(activity))}</p><button type="button" data-progression-mode="standard" data-activity-id="${esc(activity.id)}">${mode==='standard'?'Using standard version':'Return to standard'}</button></article><article class="progressionCard ${mode==='challenge'?'isActive':''}"><div class="progressionDemand">Challenge · increase ${esc(rule.label.toLowerCase())}</div><h5>Progression</h5><p>${esc(rule.challenge)}</p><button type="button" data-progression-mode="challenge" data-activity-id="${esc(activity.id)}">${mode==='challenge'?'Using challenge version':'Use challenge version'}</button></article></div>`;
}
function render(){scheduled=false;installStyle();rows().forEach(renderActivity);root.querySelectorAll('.toolRow > .progressionLadder').forEach(panel=>{const row=panel.closest('.toolRow'),title=row?.querySelector('[data-activity][data-field="title"]')?.value||'';if(!isSpecific(title))panel.remove();});}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render);}
function applyMode(id,mode){
 const title=root.querySelector(`[data-activity="${CSS.escape(id)}"][data-field="title"]`),instructions=root.querySelector(`[data-activity="${CSS.escape(id)}"][data-field="instructions"]`);if(!title||!instructions)return;
 const activity={id,title:title.value||'',instructionsEl:instructions,row:title.closest('.toolRow')},demand=primaryDemand(activity),base=cleanInstructions(instructions.value);
 const next=mode==='standard'?base:`${base}${base?'\n\n':''}${variationText(mode,demand)}`;
 instructions.value=next;instructions.dispatchEvent(new Event('input',{bubbles:true}));
 const out=document.getElementById('toolStatus');if(out)out.textContent=mode==='standard'?'Returned to the teacher’s standard exercise.':`${mode==='easy'?'Easier':'Challenge'} variation applied by changing ${RULES[demand.id]?.label||demand.label} first.`;
 schedule();
}
root.addEventListener('click',event=>{const button=event.target.closest('[data-progression-mode][data-activity-id]');if(!button)return;event.preventDefault();event.stopPropagation();applyMode(button.dataset.activityId,button.dataset.progressionMode);});
root.addEventListener('input',event=>{if(event.target.matches('[data-activity][data-field="title"],[data-activity][data-field="instructions"]'))schedule();});
root.addEventListener('change',event=>{if(event.target.dataset.concept||event.target.dataset.skill||event.target.matches('select[data-field]'))schedule();});
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
})();