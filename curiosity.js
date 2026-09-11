(()=>{
'use strict';
const root=document.getElementById('curiosity');if(!root)return;
const $=id=>document.getElementById(id);
const wrap=content=>'<svg viewBox="0 0 600 430" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">'+content+'</svg>';
const scenes={
dance:wrap('<ellipse cx="300" cy="355" rx="185" ry="24" fill="#cbbfaf"/><path d="M135 342Q80 190 170 100Q210 57 248 91L207 179Q169 219 224 337Z" fill="#bb6b51"/><path d="M390 341Q486 247 451 164L394 87Q355 62 334 100L369 193Q397 236 335 335Z" fill="#668b80"/><circle cx="222" cy="90" r="31" fill="#ddbd7a"/><circle cx="367" cy="85" r="31" fill="#806996"/><path d="M200 191Q291 267 385 186" fill="none" stroke="#354556" stroke-width="9" stroke-linecap="round"/><circle class="curiosityDrift" cx="302" cy="196" r="13" fill="#fffaf0"/><path d="M270 68L291 38L311 68Z" fill="#806996"/><circle cx="496" cy="69" r="18" fill="#ddbd7a"/><path d="M78 284L110 268M92 310L119 297" stroke="#668b80" stroke-width="4" stroke-linecap="round"/>'),
practice:wrap('<ellipse cx="300" cy="354" rx="198" ry="24" fill="#cbd8d2"/><path d="M302 54V112M145 112H452M145 112V210M302 112V167M452 112V230" stroke="#354556" stroke-width="4" fill="none"/><circle class="noteShape noteShape0" cx="145" cy="249" r="47" fill="#b67866"/><path class="noteShape noteShape1" d="M302 167L353 267H251Z" fill="#83739d"/><rect class="noteShape noteShape2" x="416" y="230" width="74" height="74" rx="6" fill="#d6b568"/><circle cx="302" cy="51" r="9" fill="#354556"/><path d="M185 343Q233 300 276 344T368 343" stroke="#668b80" stroke-width="4" fill="none"/><circle class="curiosityDrift" cx="507" cy="108" r="15" fill="#f8f6ea"/>'),
stories:wrap('<ellipse cx="300" cy="354" rx="177" ry="22" fill="#d8c9bc"/><path d="M134 149L276 176V337L134 302Z" fill="#668b80"/><path d="M276 176L464 111V282L276 337Z" fill="#836b96"/><path d="M144 123Q218 116 276 165V315Q221 274 144 275Z" fill="#fffbef"/><path d="M276 165Q342 107 452 91V259Q350 271 276 315Z" fill="#f0e5cc"/><path d="M165 170L246 187M165 199L246 216M315 176L420 138M315 208L420 170M315 240L386 215" stroke="#b4a796" stroke-width="4"/><circle class="curiosityDrift" cx="199" cy="63" r="29" fill="#b67866"/><path d="M351 42L364 72L397 74L372 94L380 124L353 107L326 124L333 92L310 73L341 70Z" fill="#d6b568"/>'),
crew:wrap('<circle cx="300" cy="201" r="135" fill="none" stroke="#c5bdd8" stroke-width="2" stroke-dasharray="3 12"/><ellipse cx="300" cy="244" rx="205" ry="80" fill="none" stroke="#c5bdd8" stroke-width="2" transform="rotate(-18 300 244)"/><ellipse cx="300" cy="350" rx="117" ry="16" fill="#c5bdd8"/><g class="curiosityDrift"><path d="M244 225Q248 125 302 130Q354 133 357 225Z" fill="#89aaa3"/><ellipse cx="300" cy="240" rx="114" ry="39" fill="#83739d"/><ellipse cx="300" cy="225" rx="114" ry="31" fill="#e9dfc9"/><circle cx="231" cy="227" r="7" fill="#b67866"/><circle cx="280" cy="241" r="7" fill="#b67866"/><circle cx="332" cy="239" r="7" fill="#b67866"/><circle cx="375" cy="224" r="7" fill="#b67866"/></g><circle cx="467" cy="106" r="32" fill="#d6b568"/><circle cx="118" cy="263" r="20" fill="#b67866"/><path d="M180 65V91M167 78H193M430 320V342M419 331H441" stroke="#806996" stroke-width="4"/>')
};
const doors={
dance:{eyebrow:'In person · New York City',name:'A conversation\nwithout words.',description:'Find a class, explore Lambada, or bring a question to a private session. Start with the kind of dancing you want to understand.',href:'/classes/',cta:'Find your class',secondary:'/privates/',secondaryText:'Explore private coaching →',plate:'Study 01 · Connection'},
practice:{eyebrow:'Zoukable · Your practice playground',name:'Give your curiosity\na rhythm.',description:'Explore timing, choose a practice focus, and build your own journey. Your next discovery can begin with one small question.',href:'/zoukable/?page=rhythm',cta:'Explore Zoukable',secondary:'/how-to-practice-zouk/',secondaryText:'Read the practice guide →',plate:'Study 02 · Rhythm & balance'},
stories:{eyebrow:'The Journal · Ideas from the dance floor',name:'Stay for\na good question.',description:'Head movement, teaching, connection, and the things we are still figuring out. Read Gab’s latest article, or bring a perspective of your own.',href:'/journal/?article=2dfc59b4-ae70-4f92-931a-57c15cac1e84#articleReader',cta:'Read about head movement',secondary:'/journal/#contribute',secondaryText:'Propose an article →',plate:'Study 03 · An open book'},
crew:{eyebrow:'Zouk Atlas · The mentorship world',name:'A shared ship.\nYour own discoveries.',description:'Your lessons, practice, and personal map meet in the member hub. Come aboard if you are a member, or discover what mentorship includes.',href:'/mentorship-hub/',cta:'Enter the member hub',secondary:'/mentorship/',secondaryText:'Discover mentorship →',plate:'Study 04 · The observatory'}
};
let selected='dance',sound=false,audio=null;
function select(key,announce=true){
 if(!doors[key])return;selected=key;const d=doors[key];
 root.querySelectorAll('[data-door]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.door===key));});
 $('curiosity-panel').dataset.door=key;$('curiosity-art').innerHTML=scenes[key];
 $('curiosity-eyebrow').textContent=d.eyebrow;$('curiosity-name').textContent=d.name;$('curiosity-description').textContent=d.description;
 $('curiosity-link').textContent=d.cta+' ↗';$('curiosity-link').href=d.href;
 $('curiosity-secondary').textContent=d.secondaryText;$('curiosity-secondary').href=d.secondary;
 root.querySelector('.curiosityPlate').textContent=d.plate;$('curiosity-instrument').hidden=key!=='practice';
 if(announce)$('curiosity-status').textContent=d.eyebrow+' selected.';
}
root.querySelectorAll('button[data-door]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.door)));
$('curiosity-sound').addEventListener('click',async()=>{
 if(!sound){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw Error();audio=audio||new A();await audio.resume();sound=true;}catch(_){$('curiosity-status').textContent='Sound is unavailable here. You can still play with the shapes.';sound=false;}}
 else sound=false;
 $('curiosity-sound').setAttribute('aria-pressed',String(sound));$('curiosity-sound').textContent=sound?'Sound on · turn off':'Sound off · turn on';
});
root.querySelectorAll('[data-note]').forEach(b=>b.addEventListener('click',()=>{
 const n=Number(b.dataset.note),shape=root.querySelector('.noteShape'+n);
 if(shape){shape.classList.remove('notePlayed');void shape.getBoundingClientRect();shape.classList.add('notePlayed');}
 if(sound&&audio&&audio.state==='running'){const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;osc.type='sine';osc.frequency.value=[261.63,329.63,392][n];gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.08,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+.45);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.5);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
}));
select('dance',false);
})();
