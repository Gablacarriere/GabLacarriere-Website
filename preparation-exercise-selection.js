(() => {
'use strict';
const root=document.getElementById('teachingWorkbench');
if(!root||root.dataset.tool!=='session-planner')return;
const CURR=window.GAB_CURRICULUM,LINKS=window.GAB_CURRICULUM_LINKS;
if(!CURR||!LINKS)return;
let scheduled=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const selectedIds=()=>[...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(x=>x.dataset.concept);
const selectedDance=()=>root.querySelector('select[data-field="dance"]')?.value||'zouk';

const DEMAND_IDS={
 'Range of motion':'range','Balance & axis':'axis','Coordination':'coordination','Speed / acceleration':'speed',
 'Partner interaction':'partner','Rhythm / timing':'rhythm','Support / load':'load','Attention / decision load':'attention'
};
const PATTERNS={
 range:/range|mobility|circle|rotation|dissociation|extension|flexion|neck|head|thoracic|hip|shoulder|spiral|cambre|cambré/,
 axis:/balance|axis|weight transfer|weight|foot|feet|ankle|landing|support|single leg|turn|pivot|center/,
 coordination:/coordina|layer|sequence|dissociation|isolation|head|turn|step|pathway|timing|combine/,
 speed:/speed|tempo|quick|fast|acceleration|deceler|turn|rotation|chicote|whip/,
 partner:/partner|connection|frame|lead|follow|contact|tone|elastic|signal|distance/,
 rhythm:/rhythm|timing|count|pulse|beat|tempo|bpm|music|phrase/,
 load:/support|resistance|active|strength|trunk|core|glute|counterbalance|elastic|control|isometric/,
 attention:/choice|respond|notice|observe|variable|decision|feedback|change|partner|timing|attention/
};
const STRATEGIES={
 range:{title:'Active range rehearsal',minutes:4,body:'Explore the lesson pathway through comfortable active range. Start smaller and slower than the class version.',regress:'Use a smaller range or a supported position.',progress:'Increase range only toward what the lesson actually requires.'},
 axis:{title:'Axis & transfer checkpoint',minutes:4,body:'Prepare feet and ankles, complete weight transfer, then add a landing, pivot or small rotational demand.',regress:'Two-foot support and slower transfers.',progress:'Single-leg checkpoint, displacement, then rotation.'},
 coordination:{title:'Layer-by-layer coordination',minutes:5,body:'Separate the components before combining them: feet → torso → head/arms → connection or music.',regress:'Keep only one body layer or one direction.',progress:'Add one layer at a time while the earlier layer survives.'},
 speed:{title:'Speed ramp',minutes:4,body:'Rehearse the same pathway below class speed before approaching the lesson tempo.',regress:'Half-speed with pauses at checkpoints.',progress:'Increase speed without changing shape, timing or control.'},
 partner:{title:'Solo-to-partner information bridge',minutes:5,body:'Organize the task alone first when useful, then add light, clear partner information with low complexity.',regress:'Solo or fixed contact with one predictable signal.',progress:'Add changing direction, partner or entry while preserving clarity.'},
 rhythm:{title:'Pulse & transfer primer',minutes:4,body:'Establish pulse and complete weight transfer before layering the main movement.',regress:'Count aloud with one basic step.',progress:'Change tempo or subdivision while preserving transfer.'},
 load:{title:'Active support primer',minutes:4,body:'Prepare the active support needed for extension, elasticity or shared load without creating fatigue.',regress:'Lower load, smaller leverage or isometric control.',progress:'Increase leverage or shared load only while organization remains clear.'},
 attention:{title:'One-variable attention task',minutes:4,body:'Give students one observable variable to notice before adding choices or environmental complexity.',regress:'One predictable task with one cue.',progress:'Add one decision, partner change or variation at a time.'}
};
function demandProfile(){
 const map=document.getElementById('movementDemandMap');if(!map)return [];
 return [...map.querySelectorAll('.demandItem')].map(card=>{
  const label=card.querySelector('h4')?.textContent?.trim()||'',meta=card.querySelector('.demandMeta')?.textContent?.toLowerCase()||'';
  const id=DEMAND_IDS[label];if(!id)return null;
  const score=meta.includes('high')?3:meta.includes('moderate')?2:1;
  return {id,label,score,level:score===3?'high':score===2?'moderate':'low'};
 }).filter(Boolean);
}
function curriculumTerms(){
 const targets=selectedIds();
 const supports=CURR.prerequisites(targets,{recursive:false,track:selectedDance()});
 const supportPractice=[],targetPractice=[],seenSupport=new Set(),seenTarget=new Set();
 for(const c of supports)for(const link of LINKS.forConcept(c.id)||[]){const n=normalize(link.name);if(!seenSupport.has(n)){seenSupport.add(n);supportPractice.push({name:link.name,n});}}
 for(const id of targets)for(const link of LINKS.forConcept(id)||[]){const n=normalize(link.name);if(!seenTarget.has(n)){seenTarget.add(n);targetPractice.push({name:link.name,n});}}
 return {supports,supportPractice,targetPractice};
}
function fitLabel(total){return total>=12?'Strong fit':total>=8?'Good fit':'Related';}
function scoreCard(card,index){
 const clone=card.cloneNode(true);clone.querySelector('.selectionFit')?.remove();
 const text=normalize(clone.innerText),demands=demandProfile(),terms=curriculumTerms();
 let curriculum=0,demand=0;const reasons=[];
 const supportMatches=terms.supportPractice.filter(x=>text.includes(x.n));
 const targetMatches=terms.targetPractice.filter(x=>text.includes(x.n));
 if(supportMatches.length){curriculum+=6;reasons.push('Atlas support: '+supportMatches[0].name);}
 else if(targetMatches.length){curriculum+=3;reasons.push('Target practice: '+targetMatches[0].name);}
 else{curriculum+=Math.max(1,4-index);reasons.push('Existing curriculum-linked option');}
 const demandMatches=[];
 for(const d of demands.filter(x=>x.score>=2)){
  if(PATTERNS[d.id]?.test(text)){
   demand+=d.score;demandMatches.push(d);reasons.push(d.label);
  }
 }
 const short=/~(?:3|4|5|6|7|8) min/.test(clone.innerText);const suitability=short?1:0;
 if(short)reasons.push('Short warm-up dose');
 const total=curriculum+demand+suitability;
 return {card,total,curriculum,demand,suitability,demandMatches,reasons:[...new Set(reasons)]};
}
function strategyRanking(){
 return demandProfile().filter(d=>d.score>=2).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label)).map((d,index)=>({d,strategy:STRATEGIES[d.id],rank:index+1})).filter(x=>x.strategy).slice(0,4);
}
function activityTitles(){return [...root.querySelectorAll('[data-activity][data-field="title"]')].map(x=>x.value||'');}
function strategyAdded(strategy){return activityTitles().some(t=>t===`Specific Warm-up Strategy · ${strategy.title}`);}
function installStyle(){
 if(document.getElementById('exercise-selection-style'))return;
 const s=document.createElement('style');s.id='exercise-selection-style';s.textContent=`
 .selectionEngine{margin:16px 0;padding:15px;border:1px solid #ffffff1b;border-radius:15px;background:#0d151e}.selectionEngine h4{margin:0 0 5px}.selectionEngine>p{color:#c8cfda}.selectionStrategyGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.selectionStrategy{padding:13px;border:1px solid #ffffff1d;border-radius:13px;background:#101923}.selectionStrategy p{margin:6px 0;color:#c8cfda}.selectionRank,.selectionFit{font-size:.76rem;text-transform:uppercase;letter-spacing:.06em;color:#91ddff}.selectionFit{margin:0 0 8px;padding:8px 10px;border:1px solid #7dd8ff35;border-radius:10px;background:#0b151f}.selectionFit strong{display:block;font-size:.84rem;color:#f7f4ee}.selectionFit small{color:#bfcad5;text-transform:none;letter-spacing:0}.selectionChips{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.selectionChips span{font-size:.7rem;border:1px solid #ffffff22;border-radius:999px;padding:3px 6px;color:#dce4ed}.selectionWhy{font-size:.83rem!important;color:#91ddff!important}.warmupDrillBox .selectionFit{background:#0a121b}@media(max-width:700px){.selectionStrategyGrid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}
function renderStrategies(box){
 let engine=box.querySelector('#exerciseSelectionEngine');if(!engine){engine=document.createElement('section');engine.id='exerciseSelectionEngine';engine.className='selectionEngine';const grid=box.querySelector(':scope > .liveDrillGrid');if(grid)grid.before(engine);else box.appendChild(engine);}
 const ranked=strategyRanking();
 const signature=ranked.map(({d,strategy})=>`${d.id}:${d.score}:${strategyAdded(strategy)?1:0}`).join('|')||'empty';
 if(engine.dataset.selectionSignature===signature)return;
 engine.dataset.selectionSignature=signature;
 if(!ranked.length){engine.innerHTML='<h4>Exercise Selection Engine</h4><p>Select a lesson target or clarify the goal to rank preparation strategies by movement demand.</p>';return;}
 engine.innerHTML=`<p class="kicker">EXERCISE SELECTION ENGINE</p><h4>Start with the demands, then choose the exercise.</h4><p>These strategies are ranked by the current movement-demand map. The ranking explains the teaching fit; it is not a medical or readiness score.</p><div class="selectionStrategyGrid">${ranked.map(({d,strategy,rank})=>`<article class="selectionStrategy"><div class="selectionRank">#${rank} · ${esc(d.level)} ${esc(d.label)}</div><h4>${esc(strategy.title)}</h4><p>${esc(strategy.body)}</p><p class="selectionWhy"><strong>Why it fits:</strong> prepares ${esc(d.label.toLowerCase())}, currently a ${esc(d.level)} lesson demand.</p><p><small><strong>Regress:</strong> ${esc(strategy.regress)}<br><strong>Progress:</strong> ${esc(strategy.progress)}</small></p><button type="button" data-add-demand-strategy="${esc(d.id)}" ${strategyAdded(strategy)?'disabled':''}>${strategyAdded(strategy)?'Already added':'Add to specific warm-up'}</button></article>`).join('')}</div>`;
}
function rankWarmupDrills(box){
 const grid=box.querySelector(':scope > .liveDrillGrid');if(!grid)return;
 const cards=[...grid.querySelectorAll(':scope > .liveDrillCard')];if(!cards.length)return;
 const demandSig=demandProfile().map(d=>d.id+':'+d.score).join('|'),ids=selectedIds().join('|');
 const drillIds=cards.map(c=>c.querySelector('[data-add-warmup-drill]')?.dataset.addWarmupDrill||c.querySelector('h4')?.textContent||'');
 const stableDrillSig=[...drillIds].sort().join('|');
 const signature=ids+'||'+demandSig+'||'+stableDrillSig;
 if(grid.dataset.selectionSignature===signature)return;
 const ranked=cards.map(scoreCard).sort((a,b)=>b.total-a.total||b.curriculum-a.curriculum||String(a.card.querySelector('h4')?.textContent||'').localeCompare(String(b.card.querySelector('h4')?.textContent||'')));
 ranked.forEach((item,index)=>{
  item.card.querySelector('.selectionFit')?.remove();
  const fit=document.createElement('div');fit.className='selectionFit';
  const chips=item.reasons.slice(0,4).map(r=>`<span>${esc(r)}</span>`).join('');
  fit.innerHTML=`<strong>#${index+1} · ${fitLabel(item.total)}</strong><small>Curriculum ${item.curriculum} · demand match ${item.demand}${item.suitability?' · warm-up dose +1':''}</small><div class="selectionChips">${chips}</div>`;
  item.card.prepend(fit);grid.appendChild(item.card);
 });
 grid.dataset.selectionSignature=signature;
}
function render(){
 scheduled=false;installStyle();
 const box=document.querySelector('#warmupZoukableBridge .warmupDrillBox');if(!box)return;
 renderStrategies(box);rankWarmupDrills(box);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render);}
function setInput(el,value){if(!el)return;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));}
function addStrategy(id){
 const strategy=STRATEGIES[id],demand=demandProfile().find(d=>d.id===id);if(!strategy||strategyAdded(strategy))return;
 const add=root.querySelector('[data-action="addActivity"]');if(!add)return;add.click();
 requestAnimationFrame(()=>{
  const titles=[...root.querySelectorAll('[data-activity][data-field="title"]')],title=titles.at(-1);if(!title)return;
  const aid=title.dataset.activity;
  setInput(title,'Specific Warm-up Strategy · '+strategy.title);
  setInput(root.querySelector(`[data-activity="${aid}"][data-field="minutes"]`),strategy.minutes);
  const why=demand?`Why selected: ${demand.label} is currently a ${demand.level} lesson demand.`:'Why selected: this strategy prepares a demand identified in the lesson plan.';
  setInput(root.querySelector(`[data-activity="${aid}"][data-field="instructions"]`),`${strategy.body}\n${why}\nRegress: ${strategy.regress}\nProgress: ${strategy.progress}\nWarm-up rule: remain below the main lesson demand and stop increasing complexity when organization degrades.`);
  let inputs=[...root.querySelectorAll('[data-activity][data-field="title"]')];
  const general=inputs.some(x=>x.value.startsWith('General Warm-up'))?1:0,specific=inputs.some(x=>x.value.startsWith('Specific Warm-up —'))?1:0;
  const existing=inputs.filter(x=>x.dataset.activity!==aid&&(/^Specific Warm-up Drill/.test(x.value)||/^Specific Warm-up Strategy/.test(x.value))).length;
  const desired=Math.min(inputs.length-1,general+specific+existing);let index=inputs.findIndex(x=>x.dataset.activity===aid);
  while(index>desired){const up=root.querySelector(`[data-action="activityUp"][data-id="${aid}"]`);if(!up)break;up.click();inputs=[...root.querySelectorAll('[data-activity][data-field="title"]')];index=inputs.findIndex(x=>x.dataset.activity===aid);}
  const out=document.getElementById('toolStatus');if(out)out.textContent=`${strategy.title} added to the specific warm-up. Regression and progression cues were included.`;
  schedule();
 });
}
root.addEventListener('click',event=>{const button=event.target.closest('[data-add-demand-strategy]');if(!button)return;event.preventDefault();event.stopPropagation();addStrategy(button.dataset.addDemandStrategy);});
root.addEventListener('input',event=>{if(event.target.dataset.field&&!event.target.dataset.activity)schedule();});
root.addEventListener('change',event=>{if(event.target.dataset.concept||event.target.dataset.skill||event.target.matches('select[data-field]'))schedule();});
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
})();