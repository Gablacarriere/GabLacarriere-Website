/* Zoukable homework bridge: teacher assignments -> student drill library. */
(() => {
'use strict';
const PROJECT_URL='https://lftguwmyagkehqmaxjig.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_YzhfBB0z3emKU-rM8f_18A_Z0RUJUYt';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const state={db:null,user:null,profile:null,assignments:[],drills:[],queued:false,ready:false};

function notice(text,error=false){
 const n=document.querySelector('#notice');
 if(!n)return;
 n.textContent=text;
 n.className='notice'+(error?' error':'');
 n.hidden=!text;
}
function sourceLabel(source){return source==='granola'?'From your private-class notes':source==='class'?'From class':'Teacher assignment';}
function dueLabel(value){if(!value)return '';const d=new Date(value+'T00:00:00');return Number.isNaN(d.getTime())?'':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});}
function activeFor(studentId=state.user?.id){return state.assignments.filter(a=>a.student_id===studentId&&a.status==='active').sort((a,b)=>new Date(b.assigned_at)-new Date(a.assigned_at));}
function drillFor(id){return state.drills.find(d=>d.id===id);}

async function reloadAssignments(){
 const {data,error}=await state.db.from('zoukable_drill_assignments').select('*').order('assigned_at',{ascending:false});
 if(error)throw error;
 state.assignments=data||[];
}
async function reloadDrills(){
 const {data,error}=await state.db.from('zoukable_drills').select('id,title,objective,primary_skill_id,target_seconds,partner_mode,role,status,assigned_to,requires_clearance').order('title');
 if(error)throw error;
 state.drills=data||[];
}

function homeworkCard(a,d){
 const due=dueLabel(a.due_date);
 return `<article class="card homework-card" data-homework-card="${esc(a.id)}"><p class="kicker">HOMEWORK · ${esc(sourceLabel(a.source).toUpperCase())}</p><h3>${esc(d.title)}</h3><p class="muted compact">${esc(a.note||d.objective||'Practice this drill before your next class.')}</p><div class="pill-list"><span class="tag">${Math.max(1,Math.ceil((d.target_seconds||60)/60))} min</span>${due?`<span class="tag">Due ${esc(due)}</span>`:''}<span class="tag">Assigned by Gab</span></div><div class="actions"><button class="btn secondary" type="button" data-homework-practice="${esc(d.id)}">Practice homework</button><button class="text" type="button" data-homework-complete="${esc(a.id)}">Mark complete</button></div></article>`;
}
function decorateLibrary(active){
 const ids=new Set(active.map(a=>a.drill_id));
 document.querySelectorAll('#view .grid article.card').forEach(card=>{
  const b=card.querySelector('[data-drill]');
  if(!b||!ids.has(b.dataset.drill))return;
  card.dataset.homework='true';
  const pills=card.querySelector('.pill-list');
  if(pills&&!pills.querySelector('[data-homework-badge]'))pills.insertAdjacentHTML('beforeend','<span class="tag" data-homework-badge>Homework</span>');
 });
}
function bindStudentHomework(){
 document.querySelectorAll('[data-homework-practice]').forEach(btn=>btn.addEventListener('click',()=>{
  const target=[...document.querySelectorAll('#view [data-drill]')].find(x=>x.dataset.drill===btn.dataset.homeworkPractice);
  if(!target)return notice('This homework drill is not available in your published library yet.',true);
  if(target.disabled)return notice(target.textContent.trim()||'This homework needs teacher clearance before independent practice.',true);
  target.click();
 }));
 document.querySelectorAll('[data-homework-complete]').forEach(btn=>btn.addEventListener('click',async()=>{
  btn.disabled=true;
  try{
   const {error}=await state.db.rpc('complete_zoukable_homework',{p_assignment_id:btn.dataset.homeworkComplete});
   if(error)throw error;
   await reloadAssignments();
   renderStudentHomework();
   notice('Homework marked complete. Your practice history stays unchanged.');
  }catch(err){notice(err.message||'Could not complete homework.',true);btn.disabled=false;}
 }));
}
function renderStudentHomework(){
 if(!state.ready||state.profile?.role==='coach'||document.body.dataset.chapter!=='practice')return;
 const old=document.querySelector('#zoukable-homework-section');if(old)old.remove();
 const libraryHeading=[...document.querySelectorAll('#view .section-head')].find(x=>x.querySelector('h2')?.textContent.trim()==='Drill library');
 if(!libraryHeading)return;
 const active=activeFor();
 decorateLibrary(active);
 if(!active.length)return;
 const cards=active.map(a=>{const d=drillFor(a.drill_id);return d&&d.status==='published'?homeworkCard(a,d):'';}).filter(Boolean).join('');
 if(!cards)return;
 const section=document.createElement('div');
 section.id='zoukable-homework-section';
 section.innerHTML=`<div class="section-head"><h2>Your homework</h2><span class="tag">${active.length} active</span></div><p class="help">Homework assigned in class or captured from your private-class notes is pinned here. Granola transcripts themselves stay private to your teacher.</p><div class="grid">${cards}</div>`;
 libraryHeading.insertAdjacentElement('beforebegin',section);
 bindStudentHomework();
}
function renderTodayHomework(){
 if(!state.ready||state.profile?.role==='coach'||document.body.dataset.chapter!=='today')return;
 document.querySelector('#zoukable-homework-today')?.remove();
 const active=activeFor();if(!active.length)return;
 const intro=document.querySelector('#view .intro');if(!intro)return;
 const box=document.createElement('section');box.id='zoukable-homework-today';box.className='card';
 box.innerHTML=`<p class="kicker">HOMEWORK FROM GAB</p><h2>${active.length} active drill${active.length===1?'':'s'}</h2><p class="muted">Your assigned practice is pinned at the top of the drill library.</p><button type="button" class="btn secondary" id="open-homework">Open homework →</button>`;
 intro.insertAdjacentElement('afterend',box);
 box.querySelector('#open-homework').onclick=()=>document.querySelector('#tabs [data-tab="practice"]')?.click();
}

function coachAssignmentRows(studentId){
 const active=activeFor(studentId);
 if(!active.length)return '<p class="help">No active homework for this student.</p>';
 return active.map(a=>{const d=drillFor(a.drill_id);if(!d)return '';const due=dueLabel(a.due_date);return `<div class="row"><div class="grow"><h3>${esc(d.title)}</h3><p>${esc(sourceLabel(a.source))}${due?' · due '+esc(due):''}</p>${a.note?`<p class="help">${esc(a.note)}</p>`:''}</div><div class="actions"><button class="text" type="button" data-homework-coach="completed" data-assignment="${esc(a.id)}">Complete</button><button class="text" type="button" data-homework-coach="cancelled" data-assignment="${esc(a.id)}">Cancel</button></div></div>`;}).join('');
}
function bindCoachPanel(panel,studentId){
 panel.querySelector('#homework-form')?.addEventListener('submit',async e=>{
  e.preventDefault();const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;
  try{
   const f=new FormData(e.target);
   const args={p_drill_id:f.get('drill'),p_student_id:studentId,p_note:String(f.get('note')||'').trim(),p_due_date:f.get('due_date')||null,p_source:f.get('source')||'class',p_granola_import_id:null};
   const {error}=await state.db.rpc('assign_zoukable_homework',args);if(error)throw error;
   await reloadAssignments();renderCoachPanel();notice('Homework assigned. It is now pinned in the student’s Zoukable drill library.');
  }catch(err){notice(err.message||'Could not assign homework.',true);btn.disabled=false;}
 });
 panel.querySelectorAll('[data-homework-coach]').forEach(btn=>btn.addEventListener('click',async()=>{
  btn.disabled=true;const status=btn.dataset.homeworkCoach,now=new Date().toISOString();
  try{
   const payload={status,updated_at:now,completed_at:status==='completed'?now:null};
   const {error}=await state.db.from('zoukable_drill_assignments').update(payload).eq('id',btn.dataset.assignment);if(error)throw error;
   await reloadAssignments();renderCoachPanel();notice(status==='completed'?'Homework completed.':'Homework assignment cancelled.');
  }catch(err){notice(err.message||'Could not update homework.',true);btn.disabled=false;}
 }));
}
function renderCoachPanel(){
 if(!state.ready||state.profile?.role!=='coach'||document.body.dataset.chapter!=='coach')return;
 const select=document.querySelector('#student-select');const detail=document.querySelector('#student-detail');if(!select||!detail)return;
 if(!select.dataset.homeworkBound){select.dataset.homeworkBound='1';select.addEventListener('change',schedule);}
 detail.querySelector('#zoukable-homework-coach')?.remove();
 const studentId=select.value;if(!studentId)return;
 const drills=state.drills.filter(d=>d.status==='published'&&(!d.assigned_to||d.assigned_to===studentId));
 const panel=document.createElement('section');panel.id='zoukable-homework-coach';panel.className='card';panel.style.marginTop='22px';
 panel.innerHTML=`<p class="kicker">STUDENT HOMEWORK</p><h2>Assign practice</h2><p class="help">Use this during class, or confirm a homework item that came from Granola. One drill can be assigned to several students without duplicating it.</p><form id="homework-form" class="form form-grid"><label class="full">Published drill<select name="drill" required><option value="">Choose a drill</option>${drills.map(d=>`<option value="${esc(d.id)}">${esc(d.title)}</option>`).join('')}</select></label><label>Source<select name="source"><option value="class">Class</option><option value="granola">Granola notes</option><option value="coach">Teacher assignment</option></select></label><label>Due date (optional)<input name="due_date" type="date"></label><label class="full">Homework note / cue<textarea name="note" maxlength="2000" placeholder="What should this student focus on?"></textarea></label><button class="btn full" type="submit">Assign to drill library</button></form><div class="section-head"><h3>Active homework</h3><span class="tag">${activeFor(studentId).length}</span></div>${coachAssignmentRows(studentId)}`;
 detail.appendChild(panel);bindCoachPanel(panel,studentId);
}

function schedule(){
 if(state.queued)return;state.queued=true;
 requestAnimationFrame(()=>{state.queued=false;renderStudentHomework();renderTodayHomework();renderCoachPanel();});
}
async function boot(){
 try{
  if(!window.supabase)return;
  state.db=window.__ZOUKABLE_HOMEWORK_DB||(window.__ZOUKABLE_HOMEWORK_DB=window.supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY));
  const auth=await state.db.auth.getUser();if(auth.error||!auth.data.user)return;state.user=auth.data.user;
  const profile=await state.db.from('profiles').select('id,display_name,role').eq('id',state.user.id).single();if(profile.error)return;state.profile=profile.data;
  await Promise.all([reloadAssignments(),reloadDrills()]);state.ready=true;
  new MutationObserver(schedule).observe(document.querySelector('#view')||document.body,{childList:true,subtree:true});
  schedule();
 }catch(err){console.warn('Zoukable homework bridge unavailable',err);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
