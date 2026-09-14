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
 .liveDrillPanel{margin:18px 0 0;padding:18px;border:1px solid #9aa9a5;background:#f7f5ed}.liveDrillPanel h3{margin-bottom:4px}.liveDrillGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.liveDrillCard{padding:15px;border:1px solid #a8b1ad;background:#fffdf6}.liveDrillCard h4{margin:0 0 6px;font-size:1.04rem}.liveDrillMeta{font-size:.8rem;color:#555f5b}.liveDrillCard p{margin:7px 0}.liveDrillActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}@media(max-width:700px){.liveDrillGrid{grid-template-columns:1fr}}
 `;document.head.appendChild(style);
}
function selectedConceptIds(){return [...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(x=>x.dataset.concept);}
function relevantSkillIds(conceptIds){
 const slugs=new Set(conceptIds.flatMap(id=>(LINKS.forConcept(id)||[]).map(x=>x.skill)));
 return new Set(skills.filter(s=>slugs.has(s.slug)).map(s=>s.id));
}
function asArray(value){if(Array.isArray(value))return value;if(typeof value==='string')return value.replace(/[{}]/g,'').split(',').map(x=>x.trim()).filter(Boolean);return [];}
function recommendations(conceptIds){
 const ids=relevantSkillIds(conceptIds);if(!ids.size)return [];
 return drills.map(d=>{
   let score=0;if(ids.has(d.primary_skill_id))score+=5;
   score+=asArray(d.secondary_skills).filter(id=>ids.has(id)).length*2;
   return {drill:d,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(a.drill.title).localeCompare(String(b.drill.title))).slice(0,8).map(x=>x.drill);
}
function minutesFor(drill){const seconds=Number(drill.target_seconds)||Number(drill.min_seconds)||300;return Math.max(5,Math.min(15,Math.ceil(seconds/60)+4));}
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
function safeVideo(url){try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function render(){
 scheduled=false;installStyle();
 const anchor=document.getElementById('sessionCurriculumGuidance');if(!anchor)return;
 const conceptIds=selectedConceptIds(),signature=conceptIds.sort().join('|')+'|'+state;
 let panel=document.getElementById('liveZoukableDrills');
 if(!conceptIds.length){panel?.remove();return;}
 if(panel?.dataset.signature===signature)return;
 const recs=state==='ready'?recommendations(conceptIds):[];
 const html=state==='loading'?'<p class="toolHint">Loading published Zoukable drills…</p>':state==='error'?`<p class="toolHint">The drill library could not be loaded here. Your class plan and Zoukable records are unchanged.</p>`:recs.length?`<p class="toolHint">Published, general-use drills matched through the selected concepts’ Zoukable skill links. Adding one copies it into this class plan; the original Zoukable drill stays unchanged.</p><div class="liveDrillGrid">${recs.map(d=>{const skill=skills.find(s=>s.id===d.primary_skill_id),video=safeVideo(d.video_url);return `<article class="liveDrillCard"><p class="kicker">${esc(skill?.name||'Zoukable drill')}</p><h4>${esc(d.title)}</h4>${d.objective?`<p>${esc(d.objective)}</p>`:''}<p class="liveDrillMeta">${esc(d.partner_mode||'either')} · ${esc(d.role||'either role')} · ~${minutesFor(d)} min class block${d.bpm?` · ${esc(d.bpm)} BPM`:''}</p><div class="liveDrillActions"><button type="button" data-add-live-drill="${esc(d.id)}">Add to this session</button><a class="toolLink" href="/zoukable/?page=practice">Open Zoukable ↗</a>${video?`<a class="toolLink" href="${esc(video)}" target="_blank" rel="noopener">Demo ↗</a>`:''}</div></article>`;}).join('')}</div>`:'<p class="toolHint">No general published Zoukable drill is linked to these concepts yet. The curriculum-based activity generator is still available above.</p>';
 if(!panel){panel=document.createElement('section');panel.id='liveZoukableDrills';panel.className='liveDrillPanel';anchor.insertAdjacentElement('afterend',panel);}
 panel.dataset.signature=signature;panel.innerHTML='<h3>Live Zoukable drill suggestions</h3>'+html;
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
root.addEventListener('change',event=>{if(event.target.dataset.concept)schedule();});
root.addEventListener('click',event=>{
 const button=event.target.closest('[data-add-live-drill]');if(!button)return;
 event.preventDefault();event.stopPropagation();
 const drill=drills.find(d=>String(d.id)===button.dataset.addLiveDrill);if(!drill)return;
 const add=root.querySelector('[data-action="addActivity"]');if(!add)return;
 add.click();
 requestAnimationFrame(()=>{
  const rows=[...root.querySelectorAll('.toolRow')],row=rows.at(-1);if(!row)return;
  const title=row.querySelector('[data-field="title"]'),minutes=row.querySelector('[data-field="minutes"]'),instructions=row.querySelector('[data-field="instructions"]');
  if(title){title.value='Drill · '+drill.title;title.dispatchEvent(new Event('input',{bubbles:true}));}
  if(minutes){minutes.value=String(minutesFor(drill));minutes.dispatchEvent(new Event('input',{bubbles:true}));}
  if(instructions){instructions.value=instructionsFor(drill);instructions.dispatchEvent(new Event('input',{bubbles:true}));}
  const out=document.getElementById('toolStatus');if(out)out.textContent='Zoukable drill copied into this session. The source drill and student records were not changed.';
 });
});
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{schedule();load();},{once:true});else{schedule();load();}
})();
