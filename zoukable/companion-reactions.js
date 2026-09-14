/* Cosmetic companion reactions after real Zoukable practice saves. */
(() => {
'use strict';
const MESSAGES={
 lumi:['A little light goes a long way.','You showed up. That counts.','One small practice, one brighter step.'],
 bpmi:['Signal received. Keep the rhythm alive.','Nice work — flow builds one beat at a time.','Practice logged. Beat by beat.'],
 nimi:['Small steps count.','You do not need a giant leap today.','Gentle progress is still progress.'],
 orbi:['Let it settle. We will find it again.','Another orbit complete.','No rush. Good practice comes back around.'],
 ziggy:['New route discovered.','Trying again is part of the adventure.','Stretch, spin, grow — one piece at a time.'],
 miso:['That effort counts.','Progress tastes better together.','Good practice. Be kind to the next attempt too.'],
 kiko:['You noticed something. That matters.','Tiny details build big changes.','Observation logged. Keep looking closely.'],
 sprout:['One practice, one little sprout.','Growth can be quiet.','A little kinder, a little stronger.']
};
let last='';
function companion(){return localStorage.getItem('zoukable-companion')||'lumi';}
function message(id){const list=MESSAGES[id]||MESSAGES.lumi;const key='zoukable-reaction-count-'+id,n=Number(localStorage.getItem(key)||0);localStorage.setItem(key,String(n+1));return list[n%list.length];}
function style(){if(document.getElementById('companion-reaction-style'))return;const s=document.createElement('style');s.id='companion-reaction-style';s.textContent=`.companion-reaction{position:fixed;right:20px;bottom:20px;z-index:120;width:min(330px,calc(100% - 32px));padding:14px 16px;border:1px solid #ffffff28;border-radius:18px;background:linear-gradient(145deg,#132239,#0c1424);color:#f8f5ff;box-shadow:0 18px 50px #0008;display:flex;gap:12px;align-items:center;animation:companionIn .28s ease-out}.companion-reaction .orb{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff5cc,#b397ff 55%,#5066d8);box-shadow:0 0 24px #b899ff66;font-size:1.3rem;flex:0 0 44px}.companion-reaction strong{display:block}.companion-reaction p{margin:2px 0 0;color:#c5cfe2;font-size:.9rem}@keyframes companionIn{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}@media(max-width:600px){.companion-reaction{right:16px;bottom:16px}}`;document.head.appendChild(s);}
function show(){style();document.querySelector('.companion-reaction')?.remove();const id=companion(),names={lumi:'Lumi',bpmi:'BPMI',nimi:'Nimi',orbi:'Orbi',ziggy:'Ziggy',miso:'Miso',kiko:'Kiko',sprout:'Sprout'};const el=document.createElement('aside');el.className='companion-reaction';el.setAttribute('role','status');el.innerHTML=`<div class="orb" aria-hidden="true">✦</div><div><strong>${names[id]||'Your companion'}</strong><p>${message(id)}</p></div>`;document.body.appendChild(el);setTimeout(()=>el.remove(),5200);}
function watch(){const notice=document.getElementById('notice');if(!notice)return;const check=()=>{const t=(notice.textContent||'').trim();if(t&&t!==last&&t.startsWith('Practice saved')){last=t;show();}else if(t)last=t;};new MutationObserver(check).observe(notice,{childList:true,subtree:true,characterData:true,attributes:true});check();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();
