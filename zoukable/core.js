/* Zoukable v0.1. Interpretable pilot rules, not a validated motor-memory model. */
(function(root){
'use strict';
const RHYTHMS = [
 {id:'pulse',name:'Straight pulse',hits:[0,4],count:'1 · 2 · 3 · 4 · 5 · 6 · 7 · 8'},
 {id:'tresillo',name:'Tresillo · 3–3–2',hits:[0,3,6],count:'Three attacks across eight sixteenth-note subdivisions'},
 {id:'traditional-1',name:'Traditional 1',hits:[0,4,6],count:'1, 2 &, 3, 4 &, 5, 6 &, 7, 8 &'},
 {id:'rnb-1',name:'R&B 1',hits:[0,2,4],count:'1 & 2, 3 & 4, 5 & 6, 7 & 8'},
 {id:'traditional-2',name:'Traditional 2',hits:null,count:'1 a &, 3 a &, 5 a &, 7 a &'},
 {id:'rnb-2',name:'R&B 2',hits:null,count:'1 a 2, 3 a 4, 5 a 6, 7 a 8'},
 {id:'contemporary-1',name:'Contemporary 1 · Gab',hits:null,count:'1 & &, 3 & &, 5 & &, 7 & &'},
 {id:'contemporary-2',name:'Contemporary 2 · Gab',hits:null,count:'1 & a, 3 & a, 5 & a, 7 & a'}
];
const INTERVALS=[1,2,3,5,8,12,18,28];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
function dayKey(date=new Date()){return new Date(date).toLocaleDateString('en-CA');}
function stats(attempts,now=new Date()){
 const done=attempts.filter(a=>a.status==='completed');
 const groups=new Map();
 for(const a of done){const k=dayKey(a.completed_at)+'|'+a.drill_id;groups.set(k,Math.min(30,(groups.get(k)||0)+10));}
 const xp=[...groups.values()].reduce((a,b)=>a+b,0),days=new Set(done.map(a=>dayKey(a.completed_at)));
 let streak=0,d=new Date(now);d.setHours(12,0,0,0);
 if(!days.has(dayKey(d)))d.setDate(d.getDate()-1);
 while(days.has(dayKey(d))){streak++;d.setDate(d.getDate()-1);}
 return {xp,level:Math.floor(xp/100)+1,streak,minutes:Math.floor(done.reduce((n,a)=>n+(a.practice_seconds||0),0)/60),done:done.length,today:days.has(dayKey(now))};
}
function canPractice(d,ctx,clearances=[],uid=''){
 if(d.status!=='published')return false;
 if(d.role!=='either'&&d.role!==ctx.role)return false;
 if(d.partner_mode!=='either'&&d.partner_mode!==ctx.mode)return false;
 if(ctx.gentle&&d.physical_load!=='low')return false;
 if(d.requires_clearance&&!clearances.some(c=>c.drill_id===d.id&&c.user_id===uid&&(!c.expires_at||new Date(c.expires_at)>new Date())))return false;
 return true;
}
function buildSession(drills,states,ctx,clearances,uid,now=Date.now()){
 const eligible=drills.filter(d=>canPractice(d,ctx,clearances,uid)&&(!d.corrective_only||d.assigned_to===uid));
 const items=eligible.map(d=>{
  const matches=states.filter(s=>s.drill_id===d.id&&s.drill_version===d.version&&s.role===ctx.role&&s.partner_mode===ctx.mode&&(s.side===ctx.side||!d.side_specific));
  const due=matches.filter(s=>new Date(s.due_at).getTime()<=now).sort((a,b)=>new Date(a.due_at)-new Date(b.due_at))[0];
  const fresh=!matches.length;
  return {drill:d,review:due,priority:(d.assigned_to===uid?40:0)+(due?30:0)+(fresh?10:0),reason:d.assigned_to===uid?'Teacher assigned':due?'Review due':fresh?'First practice':'Foundation maintenance'};
 }).sort((a,b)=>b.priority-a.priority||a.drill.title.localeCompare(b.drill.title));
 let remaining=Number(ctx.minutes)*60;const queue=[];
 for(const item of items){const d=item.drill;if(d.min_seconds>remaining)continue;const seconds=Math.min(d.target_seconds,remaining);queue.push({...item,seconds});remaining-=seconds;if(remaining<30)break;}
 return queue;
}
function nextReview(old,result,hint,now=Date.now()){
 let step=old?.step||0;
 if(result==='failed')step=Math.max(0,step-1);
 else if(['good','easy'].includes(result)&&!hint&&old&&new Date(old.due_at)<=now&&now-new Date(old.last_reviewed_at)>=43200000)step=Math.min(7,step+1);
 const days=(hint||result==='failed')?1:result==='difficult'?Math.min(2,INTERVALS[step]):INTERVALS[step];
 return {step,due_at:new Date(now+days*86400000).toISOString(),last_reviewed_at:new Date(now).toISOString()};
}
function rhythmHits(id,custom){const r=RHYTHMS.find(r=>r.id===id);return custom?.[id]||r?.hits||null;}
class RhythmPlayer{
 constructor(onPulse=()=>{}){this.onPulse=onPulse;this.running=false;this.nodes=new Set();this.pending=new Set();}
 async start({bpm=75,hits=[0,4],half=false,volume=.35}={}){
  if(!Number.isFinite(bpm)||bpm<40||bpm>160)throw Error('Choose 40–160 BPM.');
  if(!Array.isArray(hits)||!hits.length||hits.some(x=>!Number.isInteger(x)||x<0||x>7))throw Error('Confirm the eight-cell rhythm grid first.');
  this.stop();const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!AC)throw Error('Audio is unavailable in this browser.');
  this.audio=this.audio||new AC();await this.audio.resume();
  if(this.audio.state!=='running')throw Error('Audio could not start. Tap Start again.');
  this.running=true;this.step=0;this.next=this.audio.currentTime+.06;this.interval=60/bpm/4*(half?2:1);this.hits=hits;this.volume=Math.min(.7,Math.max(0,volume));
  const tick=()=>{if(!this.running)return;while(this.next<this.audio.currentTime+.12){const s=this.step%8,t=this.next;if(this.hits.includes(s))this.click(t,s===0);const timer=setTimeout(()=>{this.pending.delete(timer);if(this.running)this.onPulse(s);},Math.max(0,(t-this.audio.currentTime)*1000));this.pending.add(timer);this.step++;this.next+=this.interval;}this.timer=setTimeout(tick,25);};tick();
 }
 click(time,accent){const osc=this.audio.createOscillator(),gain=this.audio.createGain();osc.frequency.value=accent?1000:720;gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.001,this.volume),time+.002);gain.gain.exponentialRampToValueAtTime(.0001,time+.045);osc.connect(gain);gain.connect(this.audio.destination);this.nodes.add(osc);osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(time);osc.stop(time+.05);}
 stop(){this.running=false;clearTimeout(this.timer);for(const t of this.pending)clearTimeout(t);this.pending.clear();for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();}
}
const API={RHYTHMS,INTERVALS,esc,safeURL,stats,buildSession,canPractice,nextReview,rhythmHits,RhythmPlayer};
if(typeof module!=='undefined'&&module.exports)module.exports=API;root.ZoukableCore=API;
})(typeof window!=='undefined'?window:globalThis);
