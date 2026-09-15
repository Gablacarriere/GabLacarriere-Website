/* Personalized practice priorities: Mentorship Roadmap + Atlas concepts + coach signals → Zoukable recommendations. */
(() => {
'use strict';
const URL='https://lftguwmyagkehqmaxjig.supabase.co';
const KEY='sb_publishable_YzhfBB0z3emKU-rM8f_18A_Z0RUJUYt';
const $=s=>document.querySelector(s);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,user=null,profile=null,roadmap=[],notes=[],assignments=[],reviews=[],skills=[],drills=[],loading=false,uiQueued=false,lastSig='';

function style(){if($('#practice-priorities-style'))return;const s=document.createElement('style');s.id='practice-priorities-style';s.textContent=`
.practice-priorities{margin:0 0 22px;padding:18px;border:1px solid rgba(154,229,255,.22);border-radius:22px;background:radial-gradient(circle at 0 0,rgba(98,179,221,.13),transparent 34%),linear-gradient(145deg,#101b2e,#0b1424);color:#f7f7ff}.practice-priorities-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-bottom:11px}.practice-priorities h2{margin:3px 0}.practice-priority-kicker{font-size:.74rem;letter-spacing:.11em;text-transform:uppercase;font-weight:850;color:#9eeaff}.practice-priority-muted{color:#aab8cf}.practice-priority-list{display:grid;gap:9px}.practice-priority-row{padding:13px 14px;border:1px solid #ffffff13;border-radius:16px;background:#ffffff06;display:grid;grid-template-columns:auto 1fr auto;gap:11px;align-items:center}.practice-priority-row:first-child{border-color:#9eeaff38;background:#15304766}.practice-priority-rank{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#ffffff09;font-weight:900;color:#dffaff}.practice-priority-row h3{margin:0 0 3px;font-size:1rem}.practice-priority-reasons{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.practice-priority-reasons span{font-size:.7rem;padding:4px 7px;border-radius:999px;border:1px solid #ffffff17;background:#ffffff08;color:#c5d1e5}.practice-priority-action{border:1px solid #9eeaff40;border-radius:999px;background:#14334b;color:#e7fbff;padding:8px 11px;font:inherit;font-size:.78rem;font-weight:850;cursor:pointer;text-decoration:none;white-space:nowrap}.practice-priority-action[disabled]{opacity:.45;cursor:not-allowed}.roadmap-priority-highlight{outline:2px solid rgba(158,234,255,.34);outline-offset:2px}.practice-priority-help{margin:12px 0 0;font-size:.78rem;color:#92a6c4}
@media(max-width:650px){.practice-priority-row{grid-template-columns:auto 1fr}.practice-priority-action{grid-column:2;justify-self:start}}
`;document.head.appendChild(s);}
function latestNote(skillId){return notes.filter(n=>n.skill_id===skillId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]||null;}
function roadmapForSkill(skill){if(!skill)return[];return roadmap.filter(item=>{
 if(!item.curriculum_node_id)return false;
 const links=window.GAB_CURRICULUM_LINKS?.forConcept(item.curriculum_node_id)||[];
 return links.some(x=>x.skill===skill.slug);
});}
function dueForDrill(id){return reviews.some(r=>r.drill_id===id&&new Date(r.due_at)<=new Date());}
function assignedForDrill(id){return assignments.some(a=>a.drill_id===id&&a.status==='active');}
function roadmapWeight(items){let n=0;for(const x of items){if(x.horizon==='next')n+=45;else if(x.horizon==='coming')n+=25;else n+=8;if(x.status==='in_progress')n+=20;if(x.pinned)n+=20;}return n;}
function scored(){return drills.filter(d=>d.status==='published').map(d=>{
 const s=skills.find(x=>x.id===d.primary_skill_id),rm=roadmapForSkill(s),note=latestNote(d.primary_skill_id),assigned=assignedForDrill(d.id),due=dueForDrill(d.id);let score=0;const reasons=[];
 if(assigned){score+=120;reasons.push('Teacher homework');}
 if(due){score+=90;reasons.push('Review due');}
 const rw=roadmapWeight(rm);if(rw){score+=rw;const top=rm.slice().sort((a,b)=>(b.pinned-a.pinned)||(a.horizon==='next'?-1:1))[0];reasons.push(`Roadmap · ${top?.title||'current focus'}`);}
 if(note){score+=(Number(note.priority)||1)*15;reasons.push(Number(note.priority)>=3?'High teacher priority':Number(note.priority)===2?'Teacher priority':'Teacher focus');}
 return {drill:d,skill:s,score,reasons,roadmap:rm,note,assigned,due};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.drill.title.localeCompare(b.drill.title));}
function availableOnPractice(item){const btn=document.querySelector(`[data-drill="${CSS.escape(item.drill.id)}"]`);return btn&&!btn.disabled?btn:null;}
function signature(items,chapter){return chapter+'|'+items.slice(0,4).map(x=>`${x.drill.id}:${x.score}:${x.reasons.join(',')}`).join('|');}
function render(){
 if(profile?.role!=='mentee')return;
 const chapter=document.body.dataset.chapter,old=$('#practice-priorities');if(!['today','practice'].includes(chapter)){old?.remove();lastSig='';return;}
 let items=scored();if(chapter==='practice'){items=items.filter(x=>availableOnPractice(x));reorderLibrary(items);}
 items=items.slice(0,3);if(!items.length){old?.remove();lastSig='';return;}
 const intro=$('#view .intro');if(!intro)return;const sig=signature(items,chapter);if(old&&sig===lastSig)return;
 let box=old;if(!box){box=document.createElement('section');box.id='practice-priorities';box.className='practice-priorities';intro.insertAdjacentElement('afterend',box);}
 box.innerHTML=`<div class="practice-priorities-head"><div><div class="practice-priority-kicker">MENTORSHIP → ATLAS → ZOUKABLE</div><h2>Practice priorities</h2><div class="practice-priority-muted">Your roadmap and teacher signals help decide what deserves attention next.</div></div></div><div class="practice-priority-list">${items.map((x,i)=>`<div class="practice-priority-row"><span class="practice-priority-rank">${i+1}</span><div><h3>${esc(x.drill.title)}</h3><div class="practice-priority-muted">${esc(x.skill?.name||'Practice')}</div><div class="practice-priority-reasons">${x.reasons.slice(0,3).map(r=>`<span>${esc(r)}</span>`).join('')}</div></div>${chapter==='practice'?`<button class="practice-priority-action" data-priority-start="${esc(x.drill.id)}">Practice →</button>`:`<a class="practice-priority-action" href="/zoukable/?page=practice">Open practice →</a>`}</div>`).join('')}</div><p class="practice-priority-help">Personalization changes recommendation order only. Safety clearance, prerequisites, setup filters, spaced review logic and teacher assessment remain authoritative.</p>`;
 box.querySelectorAll('[data-priority-start]').forEach(b=>b.onclick=()=>{const native=document.querySelector(`[data-drill="${CSS.escape(b.dataset.priorityStart)}"]`);native?.click();});lastSig=sig;
}
function reorderLibrary(items){if(!items.length)return;const ranked=new Map(items.map((x,i)=>[x.drill.id,i]));const buttons=[...document.querySelectorAll('[data-drill]')];const parent=buttons[0]?.closest('.grid');if(!parent)return;const cards=buttons.map(b=>({id:b.dataset.drill,card:b.closest('article.card')})).filter(x=>x.card);for(const {card} of cards)card.classList.remove('roadmap-priority-highlight');const priority=cards.filter(x=>ranked.has(x.id)).sort((a,b)=>ranked.get(a.id)-ranked.get(b.id));for(let i=priority.length-1;i>=0;i--){priority[i].card.classList.add('roadmap-priority-highlight');parent.prepend(priority[i].card);}}
function schedule(){if(uiQueued)return;uiQueued=true;requestAnimationFrame(()=>{uiQueued=false;render();});}
async function load(){if(loading)return;loading=true;try{if(!window.supabase)return;db=db||window.supabase.createClient(URL,KEY);const auth=await db.auth.getUser();user=auth.data?.user||null;if(!user)return;const [pR,rR,nR,aR,rvR,sR,dR]=await Promise.all([
 db.from('profiles').select('role').eq('id',user.id).single(),
 db.from('mentorship_roadmap_items').select('id,curriculum_node_id,title,horizon,status,pinned,student_visible').eq('student_id',user.id).eq('student_visible',true).in('status',['planned','in_progress']).order('pinned',{ascending:false}).order('updated_at',{ascending:false}),
 db.from('zoukable_coach_notes').select('skill_id,priority,created_at').eq('user_id',user.id).order('created_at',{ascending:false}),
 db.from('zoukable_drill_assignments').select('drill_id,status,due_date,assigned_at').eq('student_id',user.id).eq('status','active'),
 db.from('zoukable_review_states').select('drill_id,due_at').eq('user_id',user.id),
 db.from('zoukable_skills').select('id,slug,name'),
 db.from('zoukable_drills').select('id,title,status,primary_skill_id,requires_clearance')
 ]);profile=pR.data;roadmap=rR.data||[];notes=nR.data||[];assignments=aR.data||[];reviews=rvR.data||[];skills=sR.data||[];drills=dR.data||[];schedule();}catch(e){console.warn('Practice priorities',e);}finally{loading=false;}}
function start(){style();load();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('focus',load);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
