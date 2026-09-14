/* Lightweight discovery tools for the growing Zoukable drill library. */
(() => {
'use strict';
let queued=false;

function installStyle(){
 if(document.getElementById('zoukable-library-tools-style'))return;
 const s=document.createElement('style');
 s.id='zoukable-library-tools-style';
 s.textContent=`
 .library-tools{display:grid;grid-template-columns:minmax(220px,1.4fr) minmax(170px,.8fr) minmax(180px,.8fr);gap:10px;align-items:end;margin:0 0 18px;padding:16px;border:1px solid rgba(25,60,73,.14);border-radius:18px;background:rgba(255,255,255,.52)}
 .library-tools label{display:grid;gap:6px;font-size:.8rem;font-weight:700;letter-spacing:.02em}.library-tools input,.library-tools select{width:100%;min-height:44px;padding:10px 12px;border:1px solid rgba(25,60,73,.22);border-radius:12px;background:#fff;color:inherit;font:inherit}.library-tools-meta{grid-column:1/-1;display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:.82rem}.library-tools-clear{border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font:inherit}.library-empty{grid-column:1/-1;padding:22px;border:1px dashed rgba(25,60,73,.25);border-radius:16px;text-align:center}
 @media(max-width:760px){.library-tools{grid-template-columns:1fr}.library-tools-meta{grid-column:1}}
 `;
 document.head.appendChild(s);
}

function findLibrary(){
 if(document.body.dataset.chapter!=='practice')return null;
 const heading=[...document.querySelectorAll('#view .section-head')].find(x=>x.querySelector('h2')?.textContent.trim()==='Drill library');
 if(!heading)return null;
 const grid=heading.nextElementSibling;
 if(!grid?.classList.contains('grid'))return null;
 return {heading,grid};
}

function setup(){
 queued=false;installStyle();
 const found=findLibrary();if(!found)return;
 const {heading,grid}=found;
 if(document.getElementById('zoukable-library-tools'))return;
 const cards=[...grid.querySelectorAll(':scope > article.card')];
 if(!cards.length)return;
 const skills=[...new Set(cards.map(c=>c.querySelector('.kicker')?.textContent.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const tools=document.createElement('div');
 tools.id='zoukable-library-tools';tools.className='library-tools';
 tools.innerHTML=`<label>Find a drill<input id="library-search" type="search" autocomplete="off" placeholder="Search title, objective or skill…"></label><label>Skill<select id="library-skill"><option value="">All skills</option>${skills.map(x=>`<option value="${x.replaceAll('&','&amp;').replaceAll('"','&quot;')}">${x}</option>`).join('')}</select></label><label>Current setup<select id="library-access"><option value="all">Show everything</option><option value="available">Available now</option><option value="blocked">Needs another setup / clearance</option></select></label><div class="library-tools-meta"><span id="library-count"></span><button class="library-tools-clear" type="button" id="library-clear">Clear filters</button></div>`;
 heading.insertAdjacentElement('afterend',tools);
 const search=tools.querySelector('#library-search'),skill=tools.querySelector('#library-skill'),access=tools.querySelector('#library-access'),count=tools.querySelector('#library-count');
 let empty=null;
 function apply(){
  const q=search.value.trim().toLowerCase(),wantedSkill=skill.value,wantedAccess=access.value;
  let visible=0;
  cards.forEach(card=>{
   const text=card.textContent.toLowerCase();
   const cardSkill=card.querySelector('.kicker')?.textContent.trim()||'';
   const button=card.querySelector('[data-drill]');
   const available=!!button&&!button.disabled;
   const matchesText=!q||text.includes(q);
   const matchesSkill=!wantedSkill||cardSkill===wantedSkill;
   const matchesAccess=wantedAccess==='all'||(wantedAccess==='available'&&available)||(wantedAccess==='blocked'&&!available);
   const show=matchesText&&matchesSkill&&matchesAccess;
   card.hidden=!show;if(show)visible++;
  });
  count.textContent=`${visible} of ${cards.length} drills shown`;
  if(!visible){
   if(!empty){empty=document.createElement('div');empty.className='library-empty';empty.innerHTML='<strong>No drills match those filters.</strong><br><span class="muted">Clear a filter or change your current practice setup.</span>';grid.appendChild(empty);}
   empty.hidden=false;
  }else if(empty)empty.hidden=true;
 }
 search.addEventListener('input',apply);skill.addEventListener('change',apply);access.addEventListener('change',apply);
 tools.querySelector('#library-clear').onclick=()=>{search.value='';skill.value='';access.value='all';apply();search.focus();};
 apply();
}

function schedule(){if(queued)return;queued=true;requestAnimationFrame(setup);}
installStyle();
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
