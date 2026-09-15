(() => {
'use strict';
const root=document.getElementById('teachingWorkbench');
if(!root||root.dataset.tool!=='session-planner')return;
let scheduled=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const field=name=>root.querySelector(`[data-field="${name}"]:not([data-activity])`);
const fieldValue=name=>field(name)?.value?.trim()||'';
const DEMAND_IDS={'Range of motion':'range','Balance & axis':'axis','Coordination':'coordination','Speed / acceleration':'speed','Partner interaction':'partner','Rhythm / timing':'rhythm','Support / load':'load','Attention / decision load':'attention'};
const CHANGE_RULES={
 range:{label:'range',easy:'Use a smaller comfortable active range or a more supported position while preserving the same pathway.',hard:'Approach only the range required by the lesson while preserving control and an easy return.'},
 axis:{label:'balance / axis',easy:'Use two-foot support, slower weight transfer or a clearer landing checkpoint.',hard:'Add one small axis demand such as a single-leg checkpoint, displacement or rotation.'},
 coordination:{label:'coordination',easy:'Remove one body layer and keep only the essential feet/weight or torso pathway.',hard:'Add exactly one coordination layer while the earlier layers remain stable.'},
 speed:{label:'speed',easy:'Use the same task below lesson speed with useful checkpoints.',hard:'Move closer to lesson speed without changing shape, timing or control.'},
 partner:{label:'partner information',easy:'Reduce partner information: solo, fixed contact or one predictable signal.',hard:'Add one partner variable such as direction, entry, contact change or response.'},
 rhythm:{label:'rhythm / timing',easy:'Use one clear pulse or count with no tempo change.',hard:'Add one timing, subdivision or tempo variation while preserving the movement.'},
 load:{label:'support / load',easy:'Reduce leverage, resistance or shared load; prefer a self-supported version.',hard:'Increase leverage or shared load only slightly while active support and return control remain clear.'},
 attention:{label:'attention / decisions',easy:'Make the task predictable and give one observable cue only.',hard:'Add one decision or variability source while keeping the physical task unchanged.'}
};
function demandProfile(){
 const map=document.getElementById('movementDemandMap');if(!map)return [];
 return [...map.querySelectorAll('.demandItem')].map(card=>{const label=card.querySelector('h4')?.textContent?.trim()||'',meta=card.querySelector('.demandMeta')?.textContent?.toLowerCase()||'',id=DEMAND_IDS[label];if(!id)return null;const score=meta.includes('high')?3:meta.includes('moderate')?2:1;return{id,label,score};}).filter(Boolean).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
}
function planningNotes(){return norm([fieldValue('learners'),fieldValue('readiness'),fieldValue('adaptations'),fieldValue('goal')].join(' '));}
function roleFocus(){return fieldValue('roleFocus')||'both';}
function partnerMode(){return fieldValue('partnerMode')||'rotating';}
function specificRows(){return [...root.querySelectorAll('[data-activity][data-field="title"]')].map(title=>{const id=title.dataset.activity,row=title.closest('.toolRow'),instructions=root.querySelector(`[data-activity="${id}"][data-field="instructions"]`);return{id,title:title.value||'',row,instructions};}).filter(x=>x.row&&x.instructions&&/^specific warm-up/i.test(x.title));}
function demandScore(id){return demandProfile().find(d=>d.id===id)?.score||0;}
function highDemand(activity){
 const text=norm(activity.title+' '+activity.instructions.value),profile=demandProfile();
 const patterns={range:/range|mobility|head|neck|cambre|extension|tilt|spiral/,axis:/balance|axis|weight|turn|pivot|landing|counterbalance/,coordination:/coordina|layer|sequence|head|turn|dissociation|torsion/,speed:/speed|fast|tempo|double|chicote|whip/,partner:/partner|connection|frame|lead|follow|contact|elastic/,rhythm:/rhythm|timing|count|pulse|bpm|music/,load:/support|resistance|strength|counterbalance|elastic|leverage/,attention:/choice|respond|notice|variable|decision|predictable/};
 const matches=profile.filter(d=>patterns[d.id]?.test(text));return (matches[0]||profile[0]||{id:'coordination',label:'Coordination',score:2});
}
function advancedChange(activity){
 const text=norm(activity.title+' '+activity.instructions.value),head=/head|neck|cervical|boneca|chicote|tilt|cambre|cambr[eé]/.test(text),profile=demandProfile();
 let candidate=highDemand(activity);
 if(head&&(candidate.id==='range'||candidate.id==='speed'))candidate=profile.find(d=>['coordination','attention','partner','rhythm','axis'].includes(d.id)&&d.score>=2)||{id:'coordination',label:'Coordination',score:2};
 const rule=CHANGE_RULES[candidate.id]||CHANGE_RULES.coordination;
 const safety=head?' Keep head/neck range self-selected; the challenge is not automatically a bigger or faster neck pathway.':'';
 return {demand:candidate,label:rule.label,change:rule.hard+safety};
}
function branchDefinitions(activity){
 const notes=planningNotes(),role=roleFocus(),mode=partnerMode(),advanced=advancedChange(activity),branches=[];
 const add=(key,label,score,when,change,keep,reason)=>branches.push({key,label,score,when,change,keep,reason});
 let comfort=2+(demandScore('range')>=2?3:0);if(/range|mobility|comfortable|neutral|stiff|sensitive|pain|injur|neck|back|knee|shoulder|limited/.test(notes))comfort+=4;
 add('comfort','Comfort / range branch',comfort,'A dancer wants a smaller or more comfortable version of the same task.','Reduce amplitude, leverage or pathway size; keep a neutral-head option where relevant.','Keep the same timing, direction and learning objective.',demandScore('range')>=2?'Range is a meaningful lesson demand.':'Useful opt-in branch for self-selected range.');
 let axis=2+(demandScore('axis')>=2?3:0);if(/balance|axis|unstable|stability|landing|weight transfer/.test(notes))axis+=4;
 add('axis','Axis / stability branch',axis,'A dancer needs more stability before adding rotation, displacement or off-axis complexity.',CHANGE_RULES.axis.easy,'Keep the same movement intention and rhythm.',demandScore('axis')>=2?'Balance/axis is elevated in the demand map.':'Provides a stable version without changing the objective.');
 let cognitive=2+Math.max(demandScore('coordination'),demandScore('attention'));if(/beginner|new|overwhelm|overthink|confus|attention|too much|cognitive/.test(notes))cognitive+=4;
 add('cognitive','Lower cognitive-load branch',cognitive,'A dancer understands better with fewer simultaneous variables.','Use one cue and one body layer; make the first repetitions predictable.','Keep the same success criterion so the branch can rejoin the main task.',Math.max(demandScore('coordination'),demandScore('attention'))>=2?'Coordination/attention demand is already meaningful.':'Useful when explanation or layering starts to crowd practice.');
 let advancedScore=1;if(/advanced|experienced|challenge|fast learner|all star|all-star/.test(notes))advancedScore+=5;if(advanced.demand.score>=2)advancedScore+=2;
 add('advanced','Ready-for-more branch',advancedScore,'A dancer already performs the standard version reliably and needs a meaningful next problem.',advanced.change,'Change only '+advanced.label+'; preserve the standard task’s other constraints.',`Challenge comes from ${advanced.label}, not from adding random vocabulary.`);
 const partner=demandScore('partner');
 if(role!=='following')add('leader','Leader-information branch',(role==='leading'?6:3)+(partner>=2?2:0),'The leader needs a clearer version of the same partner task.','Make the proposition smaller and clearer; complete the leader’s own weight transfer before adding pathway complexity. Never use the partner to create range they are not choosing.','Keep the follower’s agency, timing and self-selected range.',partner>=2?'Partner interaction is a meaningful lesson demand.':'Role-specific clarity can reduce noise without changing the exercise.');
 if(role!=='leading')add('follower','Follower-agency branch',(role==='following'?6:3)+(partner>=2?2:0),'The follower needs a clearer version of the same partner task.','Preserve personal axis and timing, wait for usable information, and choose the range that remains controlled. A neutral/smaller pathway stays valid.','Keep the same pathway and partner information, but not forced amplitude.',partner>=2?'Partner interaction is a meaningful lesson demand.':'Keeps following active rather than passive.');
 let solo=(mode==='solo'?7:1)+(partner>=2?2:0);if(/solo|no partner|without partner|opt out/.test(notes))solo+=4;
 add('solo','Solo / low-contact branch',solo,'A dancer needs to rehearse without full partner complexity.','Rehearse the same feet, torso, timing or pathway solo or with a fixed low-information contact point.','Keep the same target concept and re-enter partner work when useful.',mode==='solo'?'The session is currently set to solo practice.':partner>=2?'Partner demand is elevated; a solo bridge can isolate organization.':'Maintains access to the task when partner complexity is not useful yet.');
 return branches.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
}
function marker(activity,branch){return `— Adaptation branch · ${activity.title} · ${branch.label} —`;}
function branchBlock(activity,branch){return `${marker(activity,branch)}\nUse when: ${branch.when}\nChange: ${branch.change}\nKeep stable: ${branch.keep}\nWhy this branch: ${branch.reason}\n— End adaptation branch —`;}
function adaptationsField(){return field('adaptations');}
function hasBranch(activity,branch){return (adaptationsField()?.value||'').includes(marker(activity,branch));}
function removeBlock(value,start){const escStart=start.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return String(value||'').replace(new RegExp(`\\n*${escStart}[\\s\\S]*?— End adaptation branch —\\n*`,'g'),'\n').trim();}
function toggleBranch(activity,branch){
 const area=adaptationsField();if(!area)return;
 const existing=hasBranch(activity,branch);let next=area.value||'';
 next=removeBlock(next,marker(activity,branch));
 if(!existing)next=`${next}${next?'\n\n':''}${branchBlock(activity,branch)}`;
 area.value=next;area.dispatchEvent(new Event('input',{bubbles:true}));
 const out=document.getElementById('toolStatus');if(out)out.textContent=existing?`${branch.label} removed from session adaptations.`:`${branch.label} added to session adaptations without changing the standard exercise.`;
 schedule();
}
function installStyle(){
 if(document.getElementById('individual-adaptation-style'))return;
 const s=document.createElement('style');s.id='individual-adaptation-style';s.textContent=`
 .adaptEngine{margin:10px 0 0;padding:13px;border:1px solid #f2dfc538;border-radius:13px;background:#151511}.adaptEngine h4{margin:0 0 5px}.adaptEngine>p{margin:5px 0;color:#c9c4ba}.adaptGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.adaptCard{padding:11px;border:1px solid #ffffff1b;border-radius:11px;background:#171b1d}.adaptCard.isAdded{border-color:#f2dfc580;background:#201c16}.adaptCard h5{margin:0 0 5px;font-size:.94rem}.adaptCard p{margin:5px 0;color:#c8cfda;font-size:.84rem}.adaptRank{font-size:.71rem;text-transform:uppercase;letter-spacing:.07em;color:#f2dfc5}.adaptKeep{color:#9fd5e9!important}.adaptNote{font-size:.78rem!important;color:#aaa!important}@media(max-width:800px){.adaptGrid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}
function renderActivity(activity){
 const branches=branchDefinitions(activity),shown=branches.filter((b,i)=>b.score>=4||i<3).slice(0,5),sig=[activity.title,planningNotes(),roleFocus(),partnerMode(),demandProfile().map(d=>d.id+':'+d.score).join('|'),shown.map(b=>b.key+':'+b.score+':'+(hasBranch(activity,b)?1:0)).join('|')].join('||');
 let panel=activity.row.querySelector(':scope > .adaptEngine');if(!panel){panel=document.createElement('section');panel.className='adaptEngine';const progression=activity.row.querySelector(':scope > .progressionLadder');if(progression)progression.after(panel);else activity.row.querySelector('.toolRowActions')?.before(panel);}
 if(panel.dataset.signature===sig)return;panel.dataset.signature=sig;
 panel.innerHTML=`<p class="kicker">INDIVIDUAL ADAPTATION</p><h4>Same objective, different route</h4><p>Branches change one useful constraint for an individual or subgroup while the standard exercise remains intact. Suggestions come from the lesson demand map and your learner/readiness notes; they are teaching prompts, not diagnoses.</p><div class="adaptGrid">${shown.map((b,i)=>{const added=hasBranch(activity,b);return `<article class="adaptCard ${added?'isAdded':''}"><div class="adaptRank">#${i+1} · ${b.score>=7?'strongly suggested':b.score>=5?'suggested':'available'}</div><h5>${esc(b.label)}</h5><p><strong>Use when:</strong> ${esc(b.when)}</p><p><strong>Change:</strong> ${esc(b.change)}</p><p class="adaptKeep"><strong>Keep stable:</strong> ${esc(b.keep)}</p><p class="adaptNote">${esc(b.reason)}</p><button type="button" data-adapt-key="${esc(b.key)}" data-activity-id="${esc(activity.id)}">${added?'Remove from adaptations':'Add to session adaptations'}</button></article>`;}).join('')}</div>`;
}
function render(){scheduled=false;installStyle();const current=specificRows();current.forEach(renderActivity);root.querySelectorAll('.toolRow > .adaptEngine').forEach(panel=>{const row=panel.closest('.toolRow'),title=row?.querySelector('[data-activity][data-field="title"]')?.value||'';if(!/^specific warm-up/i.test(title))panel.remove();});}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render);}
root.addEventListener('click',event=>{const button=event.target.closest('[data-adapt-key][data-activity-id]');if(!button)return;event.preventDefault();event.stopPropagation();const activity=specificRows().find(x=>x.id===button.dataset.activityId);if(!activity)return;const branch=branchDefinitions(activity).find(x=>x.key===button.dataset.adaptKey);if(branch)toggleBranch(activity,branch);});
root.addEventListener('input',event=>{if(event.target.matches('[data-activity][data-field="title"],[data-activity][data-field="instructions"]')||(!event.target.dataset.activity&&['learners','readiness','adaptations','goal'].includes(event.target.dataset.field)))schedule();});
root.addEventListener('change',event=>{if(event.target.dataset.concept||event.target.dataset.skill||event.target.matches('select[data-field="roleFocus"],select[data-field="partnerMode"],select[data-field="dance"]'))schedule();});
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
})();