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
 welcome:['00','A world of small discoveries','Enter your practice world','welcome'],
 journey:['01','Your traveling camp','Make this journey yours','journey'],
 today:['02','The sunrise garden','One small step, today','today'],
 practice:['03','The quiet crossing','Find your own rhythm of practice','practice'],
 skills:['04','The floating islands','Follow your foundations','skills'],
 rhythm:['05','The sound garden','Listen. Step. Repeat.','rhythm'],
 social:['06','The lantern grove','Carry your practice into the dance','social'],
 coach:['07','The creative workshop','Shape the next discovery','coach']
};
function scenery(kind){
 if(kind==='skills')return tile('✧',3);
 const ground='<ellipse cx="115" cy="148" rx="94" ry="19" fill="#749598" opacity=".12"/><ellipse cx="111" cy="133" rx="89" ry="24" fill="var(--left)"/><ellipse cx="111" cy="126" rx="89" ry="24" fill="var(--top)"/>';
 const tree='<path d="M161 121V64M161 88 144 73M161 79 177 60" stroke="#758f93" stroke-width="5" stroke-linecap="round"/><ellipse cx="158" cy="48" rx="29" ry="35" fill="#99b9b1"/><ellipse cx="177" cy="59" rx="21" ry="27" fill="#739e9c"/><ellipse cx="145" cy="62" rx="22" ry="25" fill="#b7cdb5"/>';
 const flower=(x,y)=>`<path d="M${x} ${y}v-14" stroke="#779c8f" stroke-width="2"/><circle cx="${x}" cy="${y-17}" r="5" fill="#e6a9ae"/><circle cx="${x}" cy="${y-17}" r="2" fill="#fff1c8"/>`;
 const tent='<path d="M46 113 91 49 139 108 98 133Z" fill="#d1a8b6"/><path d="M46 113 91 49 98 133Z" fill="#f5e4cc"/><path d="M65 120 89 79 93 130Z" fill="#797389"/><path d="M43 117 37 128M139 108 153 122" stroke="#ac979d" stroke-width="2"/><path d="M90 49V31L111 38 90 44" fill="#e8bd78" stroke="#bc9472" stroke-width="2"/>';
 const pool='<ellipse cx="110" cy="123" rx="93" ry="29" fill="#a4cccf"/><ellipse cx="111" cy="120" rx="77" ry="21" fill="none" stroke="#e7f5ed"/><ellipse cx="119" cy="124" rx="42" ry="10" fill="none" stroke="#d5ece6"/>';
 let art='';
 if(kind==='journey'||kind==='welcome')art=ground+tree+tent+flower(172,131)+flower(39,114);
 if(kind==='today')art=ground+tree+'<path d="M50 125Q96 124 112 101" fill="none" stroke="#fff6dd" stroke-width="12"/>'+[45,65,96,184].map((x,i)=>flower(x,110+i%2*20)).join('')+'<path d="M100 106 115 99 129 108 113 116Z" fill="#e5bd8f"/><path d="M105 111v13M124 112v10" stroke="#a68f85" stroke-width="3"/>';
 if(kind==='practice')art=pool+[[48,137],[82,122],[118,111],[157,97]].map(([x,y])=>`<ellipse cx="${x}" cy="${y+5}" rx="19" ry="9" fill="var(--right)"/><ellipse cx="${x}" cy="${y}" rx="19" ry="9" fill="var(--top)"/>`).join('')+'<path d="M184 122V86M190 122V99" stroke="#779e92" stroke-width="3"/><ellipse cx="184" cy="84" rx="4" ry="12" fill="#c1b38a"/>';
 if(kind==='rhythm')art=pool+'<path d="M52 122V64Q110 21 176 64V119" fill="none" stroke="#a5a0bf" stroke-width="5"/>'+[65,111,158].map((x,i)=>`<path d="M${x} ${i===1?44:55}V${[87,74,92][i]}" stroke="#a49ab7" stroke-width="2"/><circle class="sound-orb" data-sound-orb="${i}" cx="${x}" cy="${[90,77,95][i]}" r="13" fill="${['#edd5a0','#b7b4dc','#95c5bf'][i]}"/><ellipse cx="${x}" cy="${[116,109,123][i]}" rx="17" ry="5" fill="none" stroke="#ecf5ed"/>`).join('');
 if(kind==='social')art=ground+tree+'<path d="M42 63Q108 101 163 51" fill="none" stroke="#8b839d" stroke-width="2"/>'+[[53,71],[86,80],[120,77],[145,66]].map(([x,y])=>`<path d="M${x} ${y}v12" stroke="#8b839d"/><rect x="${x-6}" y="${y+12}" width="12" height="17" rx="5" fill="#f7dcaa"/><circle cx="${x}" cy="${y+21}" r="14" fill="#f6dbaf" opacity=".15"/>`).join('')+flower(184,132);
 if(kind==='coach')art=ground+'<path d="M90 136 107 49 144 134M100 108h42" fill="none" stroke="#b29a87" stroke-width="5"/><path d="M95 53 144 57 140 108 90 104Z" fill="#ffefd3"/><circle cx="118" cy="76" r="12" fill="#d7b0b6"/><path d="M95 98 112 81 132 103Z" fill="#9ebcb6"/><path d="M153 119 183 103 201 113 172 128Z" fill="#e6cda9"/><path d="M158 121v16M194 119v16" stroke="#a68d81" stroke-width="4"/><path d="M174 108v-18M182 107 190 88" stroke="#799a9a" stroke-width="3"/>';
 return `<svg class="island scenery-${kind}" viewBox="0 0 220 175" aria-hidden="true">${art}</svg>`;
}
function scene(chapter,seed,prefs){
 const [number,title,caption,kind]=CHAPTERS[chapter]||CHAPTERS.today;
 return `<section class="chapter-scene" aria-label="${title}"><div class="chapter-copy"><p class="eyebrow">ZOUKABLE / ${number}</p><p class="chapter-title">${title}</p><p class="chapter-caption">${caption}</p></div><div class="chapter-landscape" aria-hidden="true"><span class="chapter-sun"></span><span class="chapter-cloud cloud-one"></span><span class="chapter-cloud cloud-two"></span><div class="chapter-monument">${scenery(kind)}<span class="chapter-explorer">${explorer(seed,'',prefs)}</span></div><span class="chapter-water"></span></div></section>`;
}
const api={state,tile,explorer,scene,scenery,CHAPTERS};root.ZoukableWorld=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
