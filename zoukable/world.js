/* Presentation only: access and evidence remain owned by the existing learning rules. */
(function(root){'use strict';
function state(evidence,drills,gate,eligible){
 const published=drills.filter(d=>d.status==='published');
 const available=published.find(eligible);
 const access=available?'unlocked':!published.length?'unmapped':published.some(d=>gate(d).accessible)?'setup':'locked';
 const mastered=evidence.teacher?.status==='ready';
 return {access,mastered,drill:available,label:mastered?'Mastery observed':access==='unlocked'?'Unlocked':access==='locked'?'Locked':access==='setup'?'Change setup':'Awaiting drills',symbol:mastered?'✦':access==='locked'?'⊘':access==='unlocked'?'◇':'○'};
}
function explorer(seed,extra='',prefs={}){
 let hash=2166136261;for(const c of String(seed||'explorer'))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 const colors=['#ca786b','#4e979d','#a58abc','#c7984b','#729681','#637fa8'];const color=colors[Number.isInteger(prefs?.avatar_coat)&&prefs.avatar_coat>=0&&prefs.avatar_coat<6?prefs.avatar_coat:hash%colors.length],hat=Number.isInteger(prefs?.avatar_hat)&&prefs.avatar_hat>=0&&prefs.avatar_hat<3?prefs.avatar_hat:hash%3;
 return `<svg class="explorer ${extra}" viewBox="0 0 60 86" aria-hidden="true"><ellipse cx="30" cy="79" rx="16" ry="4" fill="#213b52" opacity=".16"/><path d="M24 65 24 77M35 65 35 77" stroke="#304a61" stroke-width="5" stroke-linecap="round"/><path d="M23 36 12 68Q30 78 48 68L37 36Z" fill="${color}"/><path d="M30 39 30 72 48 68 37 36Z" fill="#18354a" opacity=".15"/><path d="M22 40 17 58M38 40 43 55" stroke="${color}" stroke-width="7" stroke-linecap="round"/><circle cx="30" cy="27" r="12" fill="#fbf5df"/><path d="M${hat===1?'16 26Q15 7 30 6Q45 7 44 26':hat===2?'12 23 17 19 18 10 38 10 43 19 48 23':'14 23 30 3 46 23'}Z" fill="#fff9e6"/><path d="M16 25Q30 31 44 25" stroke="${color}" stroke-width="3" fill="none"/><circle cx="34" cy="28" r="1.7" fill="#244452"/><path d="M22 38 42 42 38 47 20 42Z" fill="#f5d295"/><path d="M20 42 9 49 8 40Z" fill="#f5d295"/><circle cx="30" cy="54" r="3" fill="#fff7db"/></svg>`;
}
function tile(symbol,index=0){
 const arch=`<path d="M80 94V35L112 18 144 35V94L129 102V53Q112 31 95 53V102Z" fill="var(--top)"/><path d="M112 18 144 35V94L129 102V53Q123 40 112 39Z" fill="var(--right)"/><path d="M72 35 112 14 152 35 112 57Z" fill="var(--top)"/><path d="M72 35V43L112 64V57Z" fill="var(--left)"/><path d="M112 57 152 35V43L112 64Z" fill="var(--right)"/>`;
 const tower=`<path d="M86 98V30L112 43V111Z" fill="var(--left)"/><path d="M112 43 138 30V98L112 111Z" fill="var(--right)"/><path d="M86 30 112 16 138 30 112 44Z" fill="var(--top)"/><path d="M96 33V14L112 22V41Z" fill="var(--left)"/><path d="M112 22 128 14V33L112 41Z" fill="var(--right)"/><path d="M94 14 112 2 130 14 112 24Z" fill="#fcf5da"/><path d="M119 68V56Q124 48 129 53V63Z" fill="#35596b"/>`;
 const stairs=Array.from({length:6},(_,j)=>{const x=50+j*14,y=101-j*9;return `<path d="M${x} ${y}l26 -13 17 9 -26 13Z" fill="var(--top)"/><path d="M${x} ${y}v9l17 9v-9Z" fill="var(--left)"/><path d="M${x+17} ${y+9}l26 -13v9l-26 13Z" fill="var(--right)"/>`;}).join('');
 const bridge=`<path d="M51 107V58L70 68V116Z" fill="var(--left)"/><path d="M70 68 86 59V107L70 116Z" fill="var(--right)"/><path d="M144 91V37L163 47V101Z" fill="var(--left)"/><path d="M163 47 179 38V92L163 101Z" fill="var(--right)"/><path d="M46 55 146 5 181 23 81 73Z" fill="var(--top)"/><path d="M46 55V65L81 83V73Z" fill="var(--left)"/><path d="M81 73 181 23V33L81 83Z" fill="var(--right)"/><path d="M55 53 145 9" stroke="#fff9e0" stroke-width="3"/>`;
 const structure=[arch,tower,stairs,bridge,stairs+`<circle cx="145" cy="31" r="13" fill="#fff4cf"/>`,arch][index%6];
 return `<svg class="island" viewBox="0 0 220 175" aria-hidden="true"><ellipse cx="110" cy="163" rx="66" ry="8" fill="#364365" opacity=".12"/><path d="M22 104 110 146 110 160 22 120Z" fill="var(--left)"/><path d="M110 146 198 104 198 120 110 160Z" fill="var(--right)"/><path d="M22 104 110 60 198 104 110 146Z" fill="var(--top)"/><path d="M38 105 110 69 182 105" fill="none" stroke="#fff9e0" opacity=".5"/>${structure}<path d="M157 113v-14" stroke="#688d93" stroke-width="3"/><circle cx="157" cy="96" r="8" fill="#87b0a5"/><circle cx="163" cy="99" r="6" fill="#679795"/><text x="39" y="99" fill="#385665" font-size="14">${symbol}</text></svg>`;
}
const CHAPTERS={
 welcome:['00','A world of small discoveries','Enter your practice world',0],
 journey:['01','The departure garden','Make this journey yours',1],
 today:['02','The sunrise terrace','One small step, today',0],
 practice:['03','The stepping courtyard','Find your own rhythm of practice',2],
 skills:['04','The floating islands','Follow your foundations',3],
 rhythm:['05','The echo observatory','Listen. Step. Repeat.',4],
 social:['06','The twilight garden','Carry your practice into the dance',5],
 coach:['07','The architect’s atelier','Shape the next discovery',1]
};
function scene(chapter,seed,prefs){
 const [number,title,caption,index]=CHAPTERS[chapter]||CHAPTERS.today;
 return `<section class="chapter-scene" aria-label="${title}"><div class="chapter-copy"><p class="eyebrow">ZOUKABLE / ${number}</p><p class="chapter-title">${title}</p><p class="chapter-caption">${caption}</p></div><div class="chapter-landscape" aria-hidden="true"><span class="chapter-sun"></span><span class="chapter-orbit"></span><span class="chapter-cloud cloud-one"></span><span class="chapter-cloud cloud-two"></span><div class="chapter-distant">${tile('·',(index+1)%6)}</div><div class="chapter-monument">${tile('✧',index)}<span class="chapter-explorer">${explorer(seed,'',prefs)}</span></div><span class="chapter-water"></span></div></section>`;
}
const api={state,tile,explorer,scene,CHAPTERS};root.ZoukableWorld=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
