/* Zoukable unlock celebrations + persistent achievement collection. */
(() => {
'use strict';
const URL='https://lftguwmyagkehqmaxjig.supabase.co';
const KEY='sb_publishable_YzhfBB0z3emKU-rM8f_18A_Z0RUJUYt';
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,user=null,profile=null,identity=null,companion=null,defs=[],earned=[],progress={xp:0},cosmetics=[],loading=false,dialog=null,queue=[],showing=false,refreshTimer=null;

const VOICES={
 lumi:['A new light just switched on.','You showed up. I noticed.'],
 bpmi:['Beat locked. Progress logged.','That practice had momentum.'],
 nimi:['Small step, real growth.','You do not have to rush this.'],
 orbi:['Another orbit completed.','Progress can move in more than one direction.'],
 ziggy:['New territory. Nice.','That is what trying something new looks like.'],
 miso:['This one deserves a tiny celebration.','Progress tastes better together.'],
 kiko:['I saw that little improvement.','The small details are adding up.'],
 sprout:['Something new just grew.','A little practice became something real.']
};

function installStyle(){
 if(document.getElementById('zoukable-achievement-style'))return;
 const s=document.createElement('style');
 s.id='zoukable-achievement-style';
 s.textContent=`
 .achievement-collection{margin-top:20px;padding:20px;border:1px solid #ffffff14;border-radius:24px;background:linear-gradient(145deg,#0e1829,#0a1220);color:#f7f5ff}.achievement-head{display:flex;justify-content:space-between;gap:14px;align-items:end;flex-wrap:wrap;margin-bottom:14px}.achievement-kicker{font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;font-weight:850;color:#9ce9ff}.achievement-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.achievement-card{padding:14px;border-radius:17px;border:1px solid #ffffff12;background:#ffffff06;min-height:128px}.achievement-card.earned{border-color:#ffe0a93d;background:radial-gradient(circle at 90% 0,#ffe0a915,transparent 32%),#ffffff07}.achievement-card.locked{opacity:.5}.achievement-icon{font-size:1.7rem;line-height:1}.achievement-card h3{margin:8px 0 4px;font-size:1rem}.achievement-card p{margin:0;color:#a9b6ce;font-size:.82rem}.achievement-meta{margin-top:9px;font-size:.74rem;color:#cbd4e6}.achievement-new{display:inline-flex;margin-left:6px;padding:3px 6px;border-radius:999px;background:#9ce9ff1f;color:#baf4ff;font-size:.66rem;font-weight:850}.achievement-progress{font-size:.82rem;color:#aab8cf}
 dialog.unlock-dialog{width:min(620px,calc(100% - 28px));border:1px solid #ffffff28;border-radius:28px;padding:0;background:#08111f;color:#f8f6ff;box-shadow:0 35px 100px #000b;overflow:hidden}dialog.unlock-dialog::backdrop{background:#02050be0;backdrop-filter:blur(6px)}.unlock-shell{position:relative;padding:30px;text-align:center;background:radial-gradient(circle at 50% 12%,#6f5ad94f,transparent 33%),radial-gradient(circle at 15% 75%,#2b9da644,transparent 28%),linear-gradient(155deg,#101b31,#09111f 72%);overflow:hidden}.unlock-shell:before,.unlock-shell:after{content:'✦  ·  ✧  ·  ★  ·  ✦  ·  ✧';position:absolute;left:0;right:0;color:#ffe7a9;opacity:.45;letter-spacing:1.1rem;font-size:1rem;white-space:nowrap}.unlock-shell:before{top:14px}.unlock-shell:after{bottom:14px;transform:rotate(180deg)}.unlock-body{position:relative;z-index:1}.unlock-kicker{font-size:.75rem;letter-spacing:.13em;text-transform:uppercase;font-weight:900;color:#9cecff}.unlock-medal{width:126px;height:126px;margin:20px auto 14px;border-radius:50%;display:grid;place-items:center;font-size:3.2rem;background:radial-gradient(circle at 35% 25%,#fff7d4,#d1b3ff 55%,#556bc8);box-shadow:0 0 0 7px #ffffff0d,0 18px 45px #0006,0 0 45px #a888ff42}.unlock-shell h2{font-size:clamp(2.2rem,7vw,3.7rem);line-height:.95;letter-spacing:-.045em;margin:10px 0}.unlock-description{max-width:480px;margin:0 auto;color:#bcc7da}.unlock-companion{margin:18px auto;padding:12px 14px;max-width:430px;border:1px solid #ffffff17;border-radius:16px;background:#ffffff08}.unlock-companion strong{display:block;color:#d9f7ff}.unlock-cosmetics{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin:14px 0}.unlock-chip{padding:6px 9px;border-radius:999px;background:#ffffff09;border:1px solid #ffffff18;font-size:.76rem}.unlock-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:19px}.unlock-btn{border-radius:999px;padding:12px 18px;font:inherit;font-weight:900;cursor:pointer}.unlock-btn.primary{border:0;background:linear-gradient(90deg,#7de5ef,#b293ff,#f1d09d);color:#09111f}.unlock-btn.secondary{border:1px solid #ffffff29;background:#ffffff08;color:#fff}.unlock-count{font-size:.75rem;color:#98a8c3;margin-top:10px}
 @media(max-width:800px){.achievement-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.achievement-grid{grid-template-columns:1fr}.unlock-shell{padding:25px 18px}}
 @media(prefers-reduced-motion:no-preference){.unlock-medal{animation:unlock-pop .55s cubic-bezier(.2,.8,.2,1)}@keyframes unlock-pop{0%{transform:scale(.55) rotate(-8deg);opacity:0}75%{transform:scale(1.07) rotate(2deg)}100%{transform:scale(1);opacity:1}}}
 `;
 document.head.appendChild(s);
}

function defFor(id){return defs.find(d=>d.id===id)||null;}
function earnedFor(id){return earned.find(a=>a.achievement_id===id)||null;}
function companionLine(){const lines=VOICES[identity?.companion_id]||VOICES.lumi;return lines[Math.floor(Math.random()*lines.length)];}
function cosmeticNames(meta){const rows=Array.isArray(meta?.new_cosmetics)?meta.new_cosmetics:[];return rows.filter(x=>x&&x.label).slice(0,6);}

function ensureDialog(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');
 dialog.className='unlock-dialog';
 dialog.id='zoukable-unlock-dialog';
 dialog.addEventListener('cancel',e=>e.preventDefault());
 document.body.appendChild(dialog);
 return dialog;
}

async function acknowledge(item){
 const now=new Date().toISOString();
 const {error}=await db.from('zoukable_user_achievements')
   .update({seen_at:now})
   .eq('user_id',user.id)
   .eq('achievement_id',item.achievement_id);
 if(!error){item.seen_at=now;const local=earnedFor(item.achievement_id);if(local)local.seen_at=now;}
}

async function showNext(){
 if(showing||!queue.length||profile?.role!=='mentee')return;
 showing=true;
 const item=queue.shift(),d=defFor(item.achievement_id);
 if(!d){showing=false;return showNext();}
 const dlg=ensureDialog(),newCos=cosmeticNames(item.metadata);
 dlg.innerHTML=`<div class="unlock-shell"><div class="unlock-body"><div class="unlock-kicker">NEW JOURNEY MILESTONE</div><div class="unlock-medal" aria-hidden="true">${esc(d.icon||'✦')}</div><h2>${esc(d.title)}</h2><p class="unlock-description">${esc(d.description)}</p><div class="unlock-companion"><strong>${esc(companion?.name||'Your companion')}</strong><span>“${esc(companionLine())}”</span></div>${newCos.length?`<div><div class="unlock-kicker">NEW SHIP LOOKS AVAILABLE</div><div class="unlock-cosmetics">${newCos.map(c=>`<span class="unlock-chip">${esc(c.label)}</span>`).join('')}</div></div>`:''}<div class="unlock-actions"><button class="unlock-btn primary" id="collect-achievement">Collect milestone ✦</button><a class="unlock-btn secondary" href="/zoukable/?page=crew">Open Crew & Ship</a></div><div class="unlock-count">${queue.length?`${queue.length} more milestone${queue.length===1?'':'s'} waiting`: `${d.threshold_xp} XP milestone`}</div></div></div>`;
 const collect=dlg.querySelector('#collect-achievement');
 collect.onclick=async()=>{collect.disabled=true;collect.textContent='Saving…';await acknowledge(item);dlg.close();showing=false;injectCollection();setTimeout(showNext,180);};
 if(!dlg.open)dlg.showModal();
}

function injectCollection(){
 if(document.body.dataset.chapter!=='crew')return;
 const page=document.querySelector('.crew-page');
 if(!page||document.getElementById('achievement-collection'))return;
 const achieved=defs.filter(d=>earnedFor(d.id)).length;
 const html=`<section id="achievement-collection" class="achievement-collection"><div class="achievement-head"><div><div class="achievement-kicker">JOURNEY COLLECTION</div><h2 style="margin:4px 0">Milestones</h2><p style="margin:0;color:#aab8cf">Practice leaves permanent souvenirs here.</p></div><span class="achievement-progress">${achieved} / ${defs.length} collected</span></div><div class="achievement-grid">${defs.sort((a,b)=>a.sort_order-b.sort_order).map(d=>{const a=earnedFor(d.id),unseen=a&&!a.seen_at;return `<article class="achievement-card ${a?'earned':'locked'}"><div class="achievement-icon">${a?esc(d.icon||'✦'):'◇'}</div><h3>${a?esc(d.title):'Unknown milestone'}${unseen?'<span class="achievement-new">NEW</span>':''}</h3><p>${a?esc(d.description):`Reach ${d.threshold_xp} XP to reveal this milestone.`}</p><div class="achievement-meta">${a?`Earned ${new Date(a.unlocked_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`:`${d.threshold_xp} XP`}</div></article>`;}).join('')}</div></section>`;
 page.insertAdjacentHTML('beforeend',html);
}

async function refresh({celebrate=true}={}){
 if(loading||!db||!user)return;
 loading=true;
 try{
  const [dRes,aRes,pRes]=await Promise.all([
   db.from('zoukable_achievement_definitions').select('*').order('sort_order'),
   db.from('zoukable_user_achievements').select('*').eq('user_id',user.id).order('unlocked_at'),
   db.from('student_progress').select('xp').eq('student_id',user.id).maybeSingle()
  ]);
  if(dRes.error||aRes.error)return;
  defs=dRes.data||[];earned=aRes.data||[];progress=pRes.data||{xp:0};
  document.getElementById('achievement-collection')?.remove();injectCollection();
  if(celebrate){
   const unseen=earned.filter(a=>!a.seen_at&&!queue.some(q=>q.achievement_id===a.achievement_id));
   if(unseen.length){queue.push(...unseen);setTimeout(showNext,250);}
  }
 }finally{loading=false;}
}

function watchPractice(){
 const notice=document.getElementById('notice');if(!notice)return;
 let prev=notice.textContent;
 new MutationObserver(()=>{const text=notice.textContent||'';if(text!==prev){prev=text;if(text.startsWith('Practice saved')){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refresh({celebrate:true}),450);}}}).observe(notice,{childList:true,subtree:true,characterData:true,attributes:true});
}

async function boot(){
 installStyle();
 if(!window.supabase)return;
 db=window.supabase.createClient(URL,KEY);
 const auth=await db.auth.getUser();user=auth.data?.user||null;if(!user)return;
 const [pRes,iRes,cRes]=await Promise.all([
  db.from('profiles').select('role').eq('id',user.id).single(),
  db.from('zoukable_identities').select('companion_id').eq('user_id',user.id).maybeSingle(),
  db.from('zoukable_companions').select('id,name')
 ]);
 profile=pRes.data||null;identity=iRes.data||null;companion=(cRes.data||[]).find(c=>c.id===identity?.companion_id)||null;
 await refresh({celebrate:true});
 watchPractice();
 new MutationObserver(()=>injectCollection()).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('focus',()=>refresh({celebrate:true}));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh({celebrate:true});});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
