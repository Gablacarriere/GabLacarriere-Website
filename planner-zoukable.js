/* Read-only bridge from the Session Planner to the live Zoukable drill library. */
(() => {
'use strict';
const root=document.getElementById('teachingWorkbench');
if(!root||root.dataset.tool!=='session-planner'||!window.supabase||!window.GAB_PORTAL)return;
const CURR=window.GAB_CURRICULUM,LINKS=window.GAB_CURRICULUM_LINKS;
if(!CURR||!LINKS)return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey);
let skills=[],drills=[],state='loading',errorMessage='',scheduled=false;

function installStyle(){
 if(document.getElementById('planner-zoukable-style'))return;
 const style=document.createElement('style');style.id='planner-zoukable-style';style.textContent=`
 .liveDrillPanel{margin:18px 0 0;padding:18px;border:1px solid #9aa9a5;background:#f7f5ed;color:#15181e}.liveDrillPanel h3{margin-bottom:4px}.liveDrillGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.liveDrillCard{padding:15px;border:1px solid #a8b1ad;background:#fffdf6}.liveDrillCard h4{margin:0 0 6px;font-size:1.04rem}.liveDrillMeta{font-size:.8rem;color:#555f5b}.liveDrillCard p{margin:7px 0}.liveDrillActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
 .warmupDrillBox{padding:15px;border:1px solid #7dd8ff44;border-radius:16px;background:#0b1118;color:#f7f4ee}.warmupDrillBox h3{margin:0 0 5px}.warmupDrillBox>p{color:#c8cfda}.warmupDrillBox .liveDrillCard{background:#101923;border-color:#ffffff20;color:#f7f4ee}.warmupDrillBox .liveDrillMeta,.warmupDrillBox .liveDrillCard p{color:#c8cfda}.warmupDrillBox .toolLink{color:#d9efff}
 @media(max-width:700px){.liveDrillGrid{grid-template-columns:1fr}}
 `;document.head.appendChild(style);
}
function selectedConceptIds(){return [...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(x=>x.dataset.concept);}
function selectedDance(){return root.querySelector('select[data-field="dance"]')?.value||'zouk';}
function linkedSlugs(conceptIds){return new Set(conceptIds.flatMap(id=>(LINKS.forConcept(id)||[]).map(x=>x.skill)));}
function relevantSkillIds(conceptIds){
 const slugs=linkedSlugs(conceptIds);
 return new Set(skills.filter(s=>slugs.has(s.slug)).map(s=>s.id));
}
function directSupports(conceptIds){return CURR.prerequisites(conceptIds,{recursive:false,track:selectedDance()});}
function warmupConceptIds(conceptIds){const supports=directSupports(conceptIds);return supports.length?supports.map(x=>x.id):conceptIds;}
function asArray(value){if(Array.isArray(value))return value;if(typeof value==='string')return value.replace(/[{}]/g,'').split(',').map(x=>x.trim()).filter(Boolean);return [];}
function recommendations(conceptIds,limit=8){
 const ids=relevantSkillIds(conceptIds);if(!ids.size)return [];
 return drills.map(d=>{
   let score=0;if(ids.has(d.primary_skill_id))score+=5;
   score+=asArray(d.secondary_skills).filter(id=>ids.has(id)).length*2;
   return {drill:d,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(a.drill.title).localeCompare(String(b.drill.title))).slice(0,limit).map(x=>x.drill);
}
function minutesFor(drill){const seconds=Number(drill.target_seconds)||Number(drill.min_seconds)||300;return Math.max(5,Math.min(15,Math.ceil(seconds/60)+4));}
function warmupMinutesFor(drill){const seconds=Number(drill.min_seconds)||Number(drill.target_seconds)||180;return Math.max(3,Math.min(8,Math.ceil(seconds/60)+2));}
function instructionsFor(drill){
 const lines=[];
 if(drill.objective)lines.push('Objective: '+drill.objective);
 if(drill.instructions)lines.push(drill.instructions);
 if(drill.cue)lines.push('Cue: '+drill.cue);
 if(drill.correct_feel)lines.push('Correct feel: '+drill.correct_feel);
 if(drill.simplification)lines.push('Simplify: '+drill.simplification);
 if(drill.common_mistakes)lines.push('Observe: '+drill.common_mistakes);
 return lines.join('\n');
}
function warmupInstructionsFor(drill,conceptIds){
 const supports=directSupports(conceptIds),lines=[];
 if(supports.length)lines.push('Warm-up purpose: prepare '+supports.map(x=>x.name).join(', ')+' before the main class target.');
 else lines.push('Warm-up purpose: rehearse a simpler version of the class target before increasing complexity.');
 lines.push(instructionsFor(drill));
 lines.push('Warm-up rule: keep the range, load and complexity below the main class demand; progress only while control stays clear.');
 return lines.filter(Boolean).join('\n');
}
function safeVideo(url){try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function drillCard(d,{warmup=false,conceptIds=[]}={}){
 const skill=skills.find(s=>s.id===d.primary_skill_id),video=safeVideo(d.video_url),mins=warmup?warmupMinutesFor(d):minutesFor(d);
 return `<article class="liveDrillCard"><p class="kicker">${esc(skill?.name||'Zoukable drill')}</p><h4>${esc(d.title)}</h4>${d.objective?`<p>${esc(d.objective)}</p>`:''}<p class="liveDrillMeta">${esc(d.partner_mode||'either')} · ${esc(d.role||'either role')} · ~${mins} min${d.bpm?` · ${esc(d.bpm)} BPM`:''}</p><div class="liveDrillActions"><button type="button" ${warmup?`data-add-warmup-drill="${esc(d.id)}"`:`data-add-live-drill="${esc(d.id)}"`}>${warmup?'Use in specific warm-up':'Add to this session'}</button><a class="toolLink" href="/zoukable/?page=practice">Open Zoukable ↗</a>${video?`<a class="toolLink" href="${esc(video)}" target="_blank" rel="noopener">Demo ↗</a>`:''}</div></article>`;
}
function renderWarmupBridge(conceptIds){
 const bridge=document.getElementById('warmupZoukableBridge');if(!bridge)return;
 const prepIds=warmupConceptIds(conceptIds),supports=directSupports(conceptIds),signature=[...conceptIds].sort().join('|')+'|'+state+'|'+prepIds.join('|');
 if(bridge.dataset.signature===signature)return;
 bridge.dataset.signature=signature;
 if(!conceptIds.length){bridge.innerHTML='';return;}
 if(state==='loading'){bridge.innerHTML='<div class="warmupDrillBox"><h3>Zoukable warm-up drills</h3><p>Loading published drills…</p></div>';return;}
 if(state==='error'){bridge.innerHTML='<div class="warmupDrillBox"><h3>Zoukable warm-up drills</h3><p>Live drill matching is unavailable right now. Atlas prerequisite guidance above still works.</p></div>';return;}
 const recs=recommendations(prepIds,4);
 const basis=supports.length?`Matched first to the direct Atlas supports: ${supports.map(x=>x.name).join(', ')}.`:'No direct Atlas prerequisite is specified, so suggestions are matched to the selected target itself.';
 bridge.innerHTML=`<div class="warmupDrillBox"><h3>Specific warm-up · live Zoukable suggestions</h3><p>${esc(basis)} These are preparatory options, not mandatory gates.</p>${recs.length?`<div class="liveDrillGrid">${recs.map(d=>drillCard(d,{warmup:true,conceptIds})).join('')}</div>`:'<p>No published general-use drill is linked to the nearest preparation concepts yet.</p>'}</div>`;
}
function render(){
 scheduled=false;installStyle();
 const anchor=document.getElementById('sessionCurriculumGuidance');if(!anchor)return;
 const conceptIds=selectedConceptIds(),signature=[...conceptIds].sort().join('|')+'|'+state;
 let panel=document.getElementById('liveZoukableDrills');
 if(!conceptIds.length){panel?.remove();renderWarmupBridge(conceptIds);return;}
 if(panel?.dataset.signature!==signature){
   const recs=state==='ready'?recommendations(conceptIds):[];
   const html=state==='loading'?'<p class="toolHint">Loading published Zoukable drills…</p>':state==='error'?`<p class="toolHint">The drill library could not be loaded here. Your class plan and Zoukable records are unchanged.</p>`:recs.length?`<p class="toolHint">Published, general-use drills matched through the selected concepts’ Zoukable skill links. Adding one copies it into this class plan; the original Zoukable drill stays unchanged.</p><div class="liveDrillGrid">${recs.map(d=>drillCard(d,{conceptIds})).join('')}</div>`:'<p class="toolHint">No general published Zoukable drill is linked to these concepts yet. The curriculum-based activity generator is still available above.</p>';
   if(!panel){panel=document.createElement('section');panel.id='liveZoukableDrills';panel.className='liveDrillPanel';anchor.insertAdjacentElement('afterend',panel);}
   panel.dataset.signature=signature;panel.innerHTML='<h3>Live Zoukable drill suggestions</h3>'+html;
 }
 renderWarmupBridge(conceptIds);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render);}
async function load(){
 try{
  const auth=await client.auth.getUser();if(auth.error||!auth.data.user){state='error';errorMessage='Sign-in required';schedule();return;}
  const [skillResult,drillResult]=await Promise.all([
   client.from('zoukable_skills').select('id,slug,name'),
   client.from('zoukable_drills').select('id,primary_skill_id,secondary_skills,title,objective,instructions,cue,common_mistakes,simplification,video_url,min_seconds,target_seconds,partner_mode,role,bpm,correct_feel,status,assigned_to').eq('status','published').is('assigned_to',null)
  ]);
  if(skillResult.error)throw skillResult.error;if(drillResult.error)throw drillResult.error;
  skills=skillResult.data||[];drills=drillResult.data||[];state='ready';schedule();
 }catch(error){state='error';errorMessage=error?.message||'Unavailable';schedule();}
}
function setInput(el,value){if(!el)return;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));}
function addDrillToSession(drill,{warmup=false,conceptIds=[]}={}){
 const add=root.querySelector('[data-action="addActivity"]');if(!add)return;
 add.click();
 requestAnimationFrame(()=>{
  const titles=[...root.querySelectorAll('[data-activity][data-field="title"]')],title=titles.at(-1);if(!title)return;
  const aid=title.dataset.activity;
  setInput(title,(warmup?'Specific Warm-up Drill · ':'Drill · ')+drill.title);
  setInput(root.querySelector(`[data-activity="${aid}"][data-field="minutes"]`),warmup?warmupMinutesFor(drill):minutesFor(drill));
  setInput(root.querySelector(`[data-activity="${aid}"][data-field="instructions"]`),warmup?warmupInstructionsFor(drill,conceptIds):instructionsFor(drill));
  if(warmup){
    let inputs=[...root.querySelectorAll('[data-activity][data-field="title"]')];
    const desired=Math.min(inputs.length-1,(inputs.some(x=>x.value.startsWith('General Warm-up'))?1:0)+(inputs.some(x=>x.value.startsWith('Specific Warm-up —'))?1:0));
    let index=inputs.findIndex(x=>x.dataset.activity===aid);
    while(index>desired){const up=root.querySelector(`[data-action="activityUp"][data-id="${aid}"]`);if(!up)break;up.click();inputs=[...root.querySelectorAll('[data-activity][data-field="title"]')];index=inputs.findIndex(x=>x.dataset.activity===aid);}
  }
  const out=document.getElementById('toolStatus');if(out)out.textContent=warmup?'Zoukable drill added inside the specific warm-up sequence.':'Zoukable drill copied into this session. The source drill and student records were not changed.';
 });
}
root.addEventListener('change',event=>{if(event.target.dataset.concept||event.target.matches('select[data-field="dance"]'))schedule();});
root.addEventListener('click',event=>{
 const warmButton=event.target.closest('[data-add-warmup-drill]');
 const regularButton=event.target.closest('[data-add-live-drill]');
 const button=warmButton||regularButton;if(!button)return;
 event.preventDefault();event.stopPropagation();
 const drillId=warmButton?.dataset.addWarmupDrill||regularButton?.dataset.addLiveDrill;
 const drill=drills.find(d=>String(d.id)===drillId);if(!drill)return;
 addDrillToSession(drill,{warmup:!!warmButton,conceptIds:selectedConceptIds()});
});
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{schedule();load();},{once:true});else{schedule();load();}
})();