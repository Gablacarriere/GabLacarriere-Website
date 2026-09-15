/* Zoukable alien-world presentation layer.
   It does not create or redraw the user's logo or companion. When available,
   it clones the already-rendered assigned companion SVG from cosmic-identity.js. */
(() => {
'use strict';

const CHAPTER_COPY={
 welcome:['FIRST CONTACT','Meet your companion and enter the Zoukable universe.'],
 journey:['YOUR HOME ORBIT','Set your route and make this learning universe yours.'],
 today:["TODAY'S MISSION",'One focused signal. One useful step.'],
 practice:['TRAINING DECK','Launch a focused practice mission at the right challenge level.'],
 skills:['THE SKILL GALAXY','Explore connected worlds of movement, from foundations outward.'],
 rhythm:['SIGNAL LAB','Tune into timing, pulse and rhythm.'],
 social:['SOCIAL CONSTELLATION','Carry discoveries from practice back into the dance.'],
 coach:['MISSION CONTROL','Shape the next learning expedition.']
};

const NEXT_STEP_COPY={
 'Make your explorer yours':'Meet your companion and set your orbit',
 'Choose today’s practice':"Choose today’s mission",
 'Set up your next session':'Prepare your next mission',
 'Choose an island':'Choose a world',
 'Try a three-step rhythm':'Tune a three-step signal',
 'Capture a dance memory':'Log a dance discovery',
 'Shape the next lesson':'Shape the next mission'
};

let queued=false;
function cloneExistingAlien(){
 const source=document.querySelector(
  '.cosmic-identity-card svg[aria-label*="alien companion"],'+
  'dialog.cosmic-dialog svg[aria-label*="alien companion"],'+
  '.cosmic-reveal svg[aria-label*="alien companion"]'
 );
 if(!source)return null;
 const clone=source.cloneNode(true);
 clone.classList.add('zoukable-existing-alien');
 clone.removeAttribute('width');
 clone.removeAttribute('height');
 return clone;
}

function syncAlienTarget(target,mode){
 if(!target||target.dataset.existingAlien==='1')return;
 const alien=cloneExistingAlien();
 if(!alien)return;
 if(mode==='welcome'){
  const old=[...target.children].find(el=>el.matches?.('svg.explorer'));
  if(old)old.replaceWith(alien);else target.prepend(alien);
 }else target.replaceChildren(alien);
 target.dataset.existingAlien='1';
 target.classList.add('alien-synced');
}

function syncExistingAlien(){
 syncAlienTarget(document.querySelector('#avatar'),'replace');
 syncAlienTarget(document.querySelector('.explorer-welcome'),'welcome');
 document.querySelectorAll('.map-explorer').forEach(el=>syncAlienTarget(el,'replace'));
 document.querySelectorAll('.chapter-explorer').forEach(el=>syncAlienTarget(el,'replace'));
}

function updateCopy(){
 const chapter=document.body.dataset.chapter||'today';
 const chapterCopy=CHAPTER_COPY[chapter];
 if(chapterCopy){
  const title=document.querySelector('.chapter-title');
  const caption=document.querySelector('.chapter-caption');
  if(title)title.textContent=chapterCopy[0];
  if(caption)caption.textContent=chapterCopy[1];
 }
 const step=document.querySelector('.next-step p');
 if(step&&NEXT_STEP_COPY[step.textContent.trim()])step.textContent=NEXT_STEP_COPY[step.textContent.trim()];
 const heading=document.querySelector('.world-heading .eyebrow');
 if(heading)heading.textContent='YOUR LEARNING UNIVERSE';
 const worldTitle=document.querySelector('#world-title');
 if(worldTitle&&worldTitle.textContent.trim()==='One foundation opens possibilities.')worldTitle.textContent='Your foundations form a galaxy.';
 const welcome=document.querySelector('.explorer-welcome');
 if(welcome){
  const strong=welcome.querySelector('strong');
  const help=welcome.querySelector('.help');
  if(strong)strong.textContent='Your companion';
  if(help)help.textContent='Choose a planet to explore. Visiting a world does not change its practice requirements.';
 }
 const detail=document.querySelector('#world-detail .m0');
 if(detail&&detail.textContent.includes('Select a skill above'))detail.textContent='Select a world above to explore that skill and your next practice options.';
}

function decorate(){
 document.body.classList.add('alien-aesthetic');
 updateCopy();
 syncExistingAlien();
}
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;decorate();});
}
function start(){
 decorate();
 const root=document.querySelector('#view')||document.body;
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 /* cosmic-identity loads account data asynchronously, so watch the body too until
    the existing companion artwork becomes available. */
 const identityObserver=new MutationObserver(()=>{
  if(document.querySelector('.cosmic-identity-card svg[aria-label*="alien companion"],dialog.cosmic-dialog svg[aria-label*="alien companion"]')){
   schedule();
   if(document.querySelector('#avatar')?.dataset.existingAlien==='1')identityObserver.disconnect();
  }
 });
 identityObserver.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
