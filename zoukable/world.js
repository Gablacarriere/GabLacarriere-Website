/* Presentation only: access and evidence remain owned by the existing learning rules. */
(function(root){'use strict';
function state(evidence,drills,gate,eligible){
 const published=drills.filter(d=>d.status==='published');
 const available=published.find(eligible);
 const access=available?'unlocked':!published.length?'unmapped':published.some(d=>gate(d).accessible)?'setup':'locked';
 const mastered=evidence.teacher?.status==='ready';
 return {access,mastered,drill:available,label:mastered?'Mastery observed':access==='unlocked'?'Unlocked':access==='locked'?'Locked':access==='setup'?'Change setup':'Awaiting drills',symbol:mastered?'✦':access==='locked'?'⊘':access==='unlocked'?'◇':'○'};
}
function tile(symbol){return `<svg class="island" viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="121" rx="73" ry="10" fill="currentColor" opacity=".10"/><path class="island-left" d="M22 67 110 110 110 128 22 85Z"/><path class="island-right" d="M110 110 198 67 198 85 110 128Z"/><path class="island-top" d="M22 67 110 24 198 67 110 110Z"/><path d="M42 67 110 34 178 67 110 100Z" fill="none" stroke="currentColor" opacity=".2"/><path class="island-left" d="M82 52 110 66 110 94 82 80Z"/><path class="island-right" d="M110 66 138 52 138 80 110 94Z"/><path class="island-top" d="M82 52 110 38 138 52 110 66Z"/><text x="110" y="30" text-anchor="middle" fill="currentColor" font-size="28">${symbol}</text></svg>`;}
const api={state,tile};root.ZoukableWorld=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
