/* Connects Zoukable to the mentorship hub without coupling either UI to the other's internals. */
(() => {
'use strict';
const URL='https://lftguwmyagkehqmaxjig.supabase.co';
const KEY='sb_publishable_YzhfBB0z3emKU-rM8f_18A_Z0RUJUYt';
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,user=null,snapshot=null,refreshing=false,lastRefresh=0;
const requestedMinutes=Number(new URLSearchParams(location.search).get('minutes'));
const validMinutes=[5,10,15,20,30].includes(requestedMinutes)?requestedMinutes:null;

function installStyle(){
 if(document.getElementById('hub-bridge-style'))return;
 const style=document.createElement('style');
 style.id='hub-bridge-style';
 style.textContent=`
 .hub-connection{margin:0 0 24px;padding:20px 22px;border:1px solid rgba(25,60,73,.18);border-radius:22px;background:linear-gradient(135deg,rgba(25,60,73,.08),rgba(255,255,255,.72));box-shadow:0 14px 40px rgba(22,35,34,.06)}
 .hub-connection-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap}.hub-connection h2{margin:4px 0 6px}.hub-connection p{margin:0}.hub-connection-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:16px}.hub-connection-stat{padding:12px;border:1px solid rgba(25,60,73,.12);border-radius:16px;background:rgba(255,255,255,.6)}.hub-connection-stat strong{display:block;font-size:1.2rem}.hub-connection-plan{margin-top:14px;display:grid;gap:8px}.hub-connection-plan div{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.55)}.hub-connection-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
 @media(max-width:760px){.hub-connection-grid{grid-template-columns:1fr 1fr}.hub-connection{padding:17px}}
 `;
 document.head.appendChild(style);
}

async function loadSnapshot(force=false){
 if(refreshing)return;
 if(!force&&snapshot&&Date.now()-lastRefresh<30000)return;
 refreshing=true;
 try{
  if(!db)db=window.supabase?.createClient(URL,KEY);
  if(!db)return;
  const auth=await db.auth.getUser();
  user=auth.data?.user||null;
  if(!user){snapshot=null;return;}
  const now=new Date().toISOString();
  const [goalsRes,assignRes,progressRes,dueRes,attemptRes,drillsRes]=await Promise.all([
   db.from('goals').select('title,notes,priority').eq('student_id',user.id).eq('status','active').order('priority',{ascending:true}).limit(1),
   db.from('assignments').select('title,instructions,due_date,status').eq('student_id',user.id).neq('status','done').order('due_date',{ascending:true,nullsFirst:false}).limit(1),
   db.from('student_progress').select('xp,missions_completed,current_streak,last_activity_date').eq('student_id',user.id).maybeSingle(),
   db.from('zoukable_review_states').select('drill_id,due_at').eq('user_id',user.id).lte('due_at',now),
   db.from('zoukable_attempts').select('drill_id,completed_at,practice_seconds,result').eq('user_id',user.id).eq('status','completed').order('completed_at',{ascending:false}).limit(1),
   db.from('zoukable_drills').select('id,title').eq('status','published')
  ]);
  const latest=attemptRes.data?.[0]||null;
  const published=drillsRes.data||[];
  snapshot={
   goal:goalsRes.data?.[0]||null,
   assignment:assignRes.data?.[0]||null,
   progress:progressRes.data||null,
   due:(dueRes.data||[]).length,
   latest,
   latestTitle:latest?published.find(d=>d.id===latest.drill_id)?.title||'Recent practice':null,
   published:published.length
  };
  lastRefresh=Date.now();
 }catch(e){console.warn('Zoukable hub bridge could not load',e);}
 finally{refreshing=false;render();}
}

function render(){
 installStyle();
 const view=document.getElementById('view');
 if(!view||!user||!snapshot)return;
 const chapter=document.body.dataset.chapter;
 const old=document.getElementById('mentorship-hub-connection');
 if(!['today','practice','journey'].includes(chapter)){old?.remove();return;}
 const anchor=view.querySelector('.intro');
 if(!anchor)return;
 old?.remove();
 const p=snapshot.progress||{};
 const plan=[];
 if(snapshot.goal)plan.push(`<div><strong>Current focus</strong><p>${esc(snapshot.goal.title)}${snapshot.goal.notes?` · ${esc(snapshot.goal.notes)}`:''}</p></div>`);
 if(snapshot.assignment)plan.push(`<div><strong>Open assignment</strong><p>${esc(snapshot.assignment.title)}${snapshot.assignment.due_date?` · due ${esc(snapshot.assignment.due_date)}`:''}</p></div>`);
 const section=document.createElement('section');
 section.id='mentorship-hub-connection';
 section.className='hub-connection';
 section.innerHTML=`<div class="hub-connection-head"><div><p class="eyebrow">CONNECTED TO YOUR MEMBER HUB</p><h2>Your mentorship plan travels with you.</h2><p class="muted">Coach priorities, Zoukable practice and your permanent Hub activity now share the same account.</p></div><span class="tag">SYNCED</span></div><div class="hub-connection-grid"><div class="hub-connection-stat"><strong>${Number(p.xp||0)}</strong><span>Hub XP</span></div><div class="hub-connection-stat"><strong>${Number(p.current_streak||0)}</strong><span>day momentum</span></div><div class="hub-connection-stat"><strong>${snapshot.due}</strong><span>Zoukable reviews due</span></div><div class="hub-connection-stat"><strong>${snapshot.published}</strong><span>published drills</span></div></div>${plan.length?`<div class="hub-connection-plan">${plan.join('')}</div>`:'<div class="hub-connection-plan"><div><strong>No coach-assigned focus right now</strong><p>Use the published foundation library or choose a skill from your learning world.</p></div></div>'}${snapshot.latest?`<p class="help" style="margin-top:12px">Last Zoukable practice: ${esc(snapshot.latestTitle)}.</p>`:''}<div class="hub-connection-actions"><a class="btn secondary" href="/mentorship-hub/#hub-today">Open Member Hub ↗</a>${chapter!=='practice'?'<a class="btn" href="/zoukable/?page=practice">Build today’s practice →</a>':''}</div>`;
 anchor.insertAdjacentElement('afterend',section);
 if(chapter==='practice'&&validMinutes){
  const select=view.querySelector('#session-form select[name="minutes"]');
  if(select&&select.dataset.hubPreset!=='1'){
   select.value=String(validMinutes);select.dataset.hubPreset='1';
   const note=document.createElement('p');note.className='help';note.textContent=`Opened from the Member Hub with ${validMinutes} minutes selected.`;
   select.closest('label')?.appendChild(note);
  }
 }
}

function scheduleRender(){requestAnimationFrame(render);}
async function start(){
 installStyle();
 await loadSnapshot(true);
 const observer=new MutationObserver(scheduleRender);
 observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadSnapshot(true);});
 window.addEventListener('focus',()=>loadSnapshot(true));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
