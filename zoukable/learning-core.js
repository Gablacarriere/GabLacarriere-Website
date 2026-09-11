/* Transparent learning rules. Teacher assessments authorize critical progression. */
(function(root){'use strict';const rank={developing:1,reliable:2,ready:3};
function gate(drill,ctx,notes=[],requirements=[],clearances=[],uid='',now=Date.now()){
 const override=clearances.some(c=>c.drill_id===drill.id&&c.user_id===uid&&(!c.expires_at||new Date(c.expires_at).getTime()>now));
 const rr=requirements.filter(r=>r.drill_id===drill.id).map(r=>{const n=notes.filter(n=>n.user_id===uid&&n.skill_id===r.skill_id&&n.role===ctx.role&&(n.side===(drill.side_specific?ctx.side:'not_applicable')||n.side==='not_applicable')).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)||String(b.id).localeCompare(String(a.id)))[0];return {...r,met:(rank[n?.status]||0)>=rank[r.minimum]};});
 const routes=[...new Set(rr.map(r=>r.route))];const accessible=override||(!drill.requires_clearance&&(!rr.length||routes.some(route=>rr.filter(r=>r.route===route&&r.kind!=='supporting').every(r=>r.met))));
 const ready=rr.length?routes.some(route=>rr.filter(r=>r.route===route).every(r=>r.met)):false;
 return {accessible,ready,override,requirements:rr,missing:rr.filter(r=>!r.met)};
}
function evidence(skill,attempts,drills,notes,social,ctx){
 const relevant=a=>a.status==='completed'&&a.failure_reason!=='physical'&&a.role===ctx.role&&(a.side===ctx.side||a.side==='not_applicable');
 const direct=attempts.filter(a=>relevant(a)&&a.primary_skill_id===skill.id);
 const embedded=attempts.filter(a=>relevant(a)&&a.primary_skill_id!==skill.id&&drills.find(d=>d.id===a.drill_id)?.secondary_skills?.includes(skill.id));
 const good=direct.filter(a=>['good','easy'].includes(a.result)), independent=good.filter(a=>!a.hint_used);
 const days=new Set(independent.map(a=>String(a.completed_at).slice(0,10)));
 const teacher=notes.filter(n=>n.skill_id===skill.id&&n.role===ctx.role&&(n.side===ctx.side||n.side==='not_applicable')).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
 const natural=social.filter(s=>s.skill_id===skill.id&&s.role===ctx.role&&s.outcome==='natural');
 return {direct:direct.length,embedded:embedded.length,independent:independent.length,days:days.size,ceiling:good.length?Math.max(...good.map(a=>a.variant_level)):null,teacher,natural:natural.length,confidence:teacher?'Teacher observation available':days.size>=3?'Repeated evidence on separate days':direct.length?'Limited self-reported evidence':'Not assessed',contexts:[...new Set(good.map(a=>`${a.partner_mode} · ${a.bpm} BPM · ${a.rhythm_id}`))]};
}
function bottlenecks(attempts,skills){const groups=new Map();for(const a of attempts.filter(a=>a.status==='completed'&&a.failure_reason&&a.failure_reason!=='physical')){const k=[a.primary_skill_id,a.role,a.side,a.failure_reason].join('|');const x=groups.get(k)||{skill_id:a.primary_skill_id,role:a.role,side:a.side,reason:a.failure_reason,count:0};x.count++;groups.set(k,x);}function downstream(id,seen=new Set()){for(const s of skills)if(s.prerequisites?.includes(id)&&!seen.has(s.id)){seen.add(s.id);downstream(s.id,seen);}return seen.size;}return [...groups.values()].map(x=>({...x,downstream:downstream(x.skill_id)})).sort((a,b)=>b.count-a.count||b.downstream-a.downstream);}
function nextProbe(drills,attempts,ctx,can){const completed=attempts.filter(a=>a.status==='completed'),last=completed[completed.length-1];const stage=last&&['good','easy'].includes(last.result)&&!last.hint_used?'integrated':'foundation';const used=new Set(completed.map(a=>a.drill_id));const eligible=drills.filter(d=>d.diagnostic&&can(d)&&d.min_seconds<=Math.max(0,900-completed.reduce((n,a)=>n+a.practice_seconds,0)));if(!eligible.length)return null;const fresh=eligible.filter(d=>!used.has(d.id));const d=fresh.find(d=>d.stage===stage)||fresh.find(d=>d.stage==='foundation')||(stage==='integrated'?fresh.find(d=>d.stage==='boss'):null);return d?{drill:d,seconds:Math.min(d.target_seconds,900-completed.reduce((n,a)=>n+a.practice_seconds,0)),variant:2,reason:'Diagnostic · '+d.stage}:null;}
const API={gate,evidence,bottlenecks,nextProbe};root.ZoukableLearning=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
