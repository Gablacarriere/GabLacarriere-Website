(() => {
'use strict';
const root=document.getElementById('teachingWorkbench');
if(!root||root.dataset.tool!=='session-planner')return;
let scheduled=false,historyLoaded=false,historyState=null;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const field=name=>root.querySelector(`[data-field="${name}"]:not([data-activity])`);
const reflectionEl=()=>field('reflection');
const readinessEl=()=>field('readiness');
const sessionId=()=>new URLSearchParams(location.search).get('session')||'';
const START=id=>`— Preparation feedback · ${id} —`;
const END='— End preparation feedback —';
const HISTORY_START='— Previous-class preparation evidence —';
const HISTORY_END='— End previous-class preparation evidence —';
const outcomeLabel={worked:'Worked well',mixed:'Mixed result',revisit:'Needs revisit',not_used:'Not used'};
const versionLabel={standard:'Standard',easy:'Easier',challenge:'Challenge',mixed:'Mixed levels'};

function specificRows(){
 return [...root.querySelectorAll('[data-activity][data-field="title"]')].map(title=>{
  const id=title.dataset.activity,row=title.closest('.toolRow'),instructions=root.querySelector(`[data-activity="${id}"][data-field="instructions"]`);
  return{id,title:title.value||'',row,instructions};
 }).filter(x=>x.row&&x.instructions&&/^specific warm-up/i.test(x.title));
}
function currentMode(activity){const t=activity.instructions.value||'';if(/— Generated variation: Easier —/.test(t))return'easy';if(/— Generated variation: Challenge —/.test(t))return'challenge';return'standard';}
function plannedAdaptations(activity){
 const value=field('adaptations')?.value||'',safe=activity.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),re=new RegExp(`— Adaptation branch · ${safe} · ([^—\\n]+) —`,'g');
 const out=[];let m;while((m=re.exec(value)))out.push(m[1].trim());return [...new Set(out)];
}
function parseFeedbackBlocks(text){
 const out=[],re=/— Preparation feedback · ([^\n]+) —\n([\s\S]*?)\n— End preparation feedback —/g;let m;
 while((m=re.exec(String(text||'')))){
  const body=m[2],get=prefix=>{const line=body.split('\n').find(x=>x.startsWith(prefix));return line?line.slice(prefix.length).trim():'';};
  out.push({id:m[1].trim(),activity:get('Activity:'),version:get('Version used:')||'standard',outcome:get('Outcome:')||'mixed',adaptations:get('Adaptations used:').split(' | ').filter(x=>x&&x!=='None recorded'),observation:get('Observation:'),next:get('Next class:')});
 }
 return out;
}
function currentFeedback(id){return parseFeedbackBlocks(reflectionEl()?.value||'').find(x=>x.id===id)||null;}
function stripFeedback(text,id){
 const safe=String(id).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return String(text||'').replace(new RegExp(`\\n*— Preparation feedback · ${safe} —\\n[\\s\\S]*?\\n— End preparation feedback —\\n*`,'g'),'\n').trim();
}
function recommendation(mode,outcome,adaptations=[]){
 const branch=adaptations.length?` Preserve the useful branch${adaptations.length===1?'':'es'}: ${adaptations.join(', ')}.`:'';
 if(outcome==='not_used')return 'No teaching conclusion yet. Reuse or replace this preparation only if it still fits the next lesson objective.';
 if(outcome==='revisit')return `Keep this preparation priority. Start one demand lower, keep the success criterion explicit, and delay progression until the task is repeatable.${branch}`;
 if(outcome==='mixed')return `Keep the same objective, begin one step simpler, and isolate one variable before rebuilding complexity.${branch}`;
 if(mode==='easy')return `Use the easier version as the entry point, then test the standard version once control is clear.${branch}`;
 if(mode==='challenge')return `The standard dose was not the limiting problem. Start from standard and introduce the same single-variable challenge earlier if the first repetitions are stable.${branch}`;
 if(mode==='mixed')return `Start with a clearly defined entry level next time, then progress one variable at a time instead of changing several demands together.${branch}`;
 return `Keep the standard version as the baseline. If it is immediately stable, add one controlled challenge rather than extra vocabulary.${branch}`;
}
function feedbackBlock(activity,{version,outcome,adaptations,observation}){
 const next=recommendation(version,outcome,adaptations),obs=String(observation||'').replace(/\s*\n\s*/g,' / ').trim()||'No additional note.';
 return `${START(activity.id)}\nActivity: ${activity.title}\nVersion used: ${version}\nOutcome: ${outcome}\nAdaptations used: ${adaptations.length?adaptations.join(' | '):'None recorded'}\nObservation: ${obs}\nNext class: ${next}\n${END}`;
}
function installStyle(){
 if(document.getElementById('prep-feedback-style'))return;
 const s=document.createElement('style');s.id='prep-feedback-style';s.textContent=`
 .prepFeedback{margin:10px 0 0;padding:13px;border:1px solid #9fe2c744;border-radius:13px;background:#0e1816}.prepFeedback h4{margin:0 0 5px}.prepFeedback>p{margin:5px 0;color:#c5cec9}.prepFeedbackGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.prepFeedback label{display:grid;gap:4px;font-size:.78rem;font-weight:800;color:#d6dfda}.prepFeedback select,.prepFeedback textarea{width:100%;border:1px solid #ffffff20;border-radius:10px;background:#09110f;color:#fff;padding:8px 9px;font:inherit}.prepFeedback textarea{min-height:68px;resize:vertical}.feedbackBranches{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0}.feedbackBranches label{display:flex;align-items:center;gap:5px;border:1px solid #ffffff1c;border-radius:999px;padding:5px 8px;font-size:.72rem;font-weight:700}.feedbackRecommendation{margin-top:9px;padding:10px;border-radius:10px;border:1px solid #9fe2c72c;background:#0a1311;font-size:.82rem;color:#bfe2d2}.feedbackActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px}.feedbackSaved{font-size:.75rem;color:#9fe2c7;font-weight:850}.prepHistory{margin:16px 0;padding:14px;border:1px solid #9fe2c73b;border-radius:15px;background:#0d1715}.prepHistory h4{margin:0 0 5px}.prepHistory p{margin:5px 0;color:#c8d0cc}.prepHistoryItem{padding:9px 0;border-top:1px solid #ffffff15}.prepHistoryItem:first-of-type{border-top:0}.prepHistoryItem strong{display:block}.prepHistory small{color:#aab8b1}.prepHistory button{margin-top:8px}@media(max-width:760px){.prepFeedbackGrid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}
function panelValues(panel){
 return {version:panel.querySelector('[data-feedback-version]')?.value||'standard',outcome:panel.querySelector('[data-feedback-outcome]')?.value||'mixed',adaptations:[...panel.querySelectorAll('[data-feedback-adaptation]:checked')].map(x=>x.value),observation:panel.querySelector('[data-feedback-observation]')?.value||''};
}
function updatePreview(panel){const v=panelValues(panel),el=panel.querySelector('.feedbackRecommendation');if(el)el.textContent=recommendation(v.version,v.outcome,v.adaptations);}
function renderActivity(activity){
 let panel=activity.row.querySelector(':scope > .prepFeedback');
 if(panel?.dataset.dirty==='1')return;
 const saved=currentFeedback(activity.id),branches=plannedAdaptations(activity),mode=saved?.version||currentMode(activity),outcome=saved?.outcome||'worked',sig=[activity.title,mode,outcome,branches.join('|'),saved?.observation||'',saved?.next||''].join('||');
 if(!panel){panel=document.createElement('section');panel.className='prepFeedback';const adapt=activity.row.querySelector(':scope > .adaptEngine'),progress=activity.row.querySelector(':scope > .progressionLadder');if(adapt)adapt.after(panel);else if(progress)progress.after(panel);else activity.row.querySelector('.toolRowActions')?.before(panel);}
 if(panel.dataset.signature===sig)return;panel.dataset.signature=sig;panel.dataset.dirty='0';
 const checked=new Set(saved?.adaptations||[]);
 panel.innerHTML=`<p class="kicker">AFTER TEACHING</p><h4>Did this preparation actually help?</h4><p>Record the version you used and the result. This is class evidence for the next plan—not a mastery or medical-readiness judgment.</p><div class="prepFeedbackGrid"><label>Version actually used<select data-feedback-version><option value="standard" ${mode==='standard'?'selected':''}>Standard</option><option value="easy" ${mode==='easy'?'selected':''}>Easier</option><option value="challenge" ${mode==='challenge'?'selected':''}>Challenge</option><option value="mixed" ${mode==='mixed'?'selected':''}>Mixed levels</option></select></label><label>Observed result<select data-feedback-outcome><option value="worked" ${outcome==='worked'?'selected':''}>Worked well</option><option value="mixed" ${outcome==='mixed'?'selected':''}>Mixed result</option><option value="revisit" ${outcome==='revisit'?'selected':''}>Needs revisit</option><option value="not_used" ${outcome==='not_used'?'selected':''}>Not used</option></select></label></div>${branches.length?`<p><strong>Adaptation branches actually used</strong></p><div class="feedbackBranches">${branches.map(b=>`<label><input type="checkbox" data-feedback-adaptation value="${esc(b)}" ${checked.has(b)?'checked':''}>${esc(b)}</label>`).join('')}</div>`:'<p class="toolHint">No planned individual adaptation branch is attached to this exercise yet.</p>'}<label>What did you observe?<textarea data-feedback-observation maxlength="1200" placeholder="What became clearer? What stayed difficult? What should change next time?">${esc(saved?.observation==='No additional note.'?'':saved?.observation||'')}</textarea></label><div class="feedbackRecommendation">${esc(saved?.next||recommendation(mode,outcome,saved?.adaptations||[]))}</div><div class="feedbackActions"><button type="button" data-save-prep-feedback="${esc(activity.id)}">${saved?'Update teaching evidence':'Save teaching evidence'}</button>${saved?`<button type="button" data-clear-prep-feedback="${esc(activity.id)}">Clear saved evidence</button><span class="feedbackSaved">Saved in class reflection</span>`:''}</div>`;
}
function renderRows(){specificRows().forEach(renderActivity);root.querySelectorAll('.toolRow > .prepFeedback').forEach(panel=>{const row=panel.closest('.toolRow'),title=row?.querySelector('[data-activity][data-field="title"]')?.value||'';if(!/^specific warm-up/i.test(title))panel.remove();});}
function saveFeedback(id){
 const activity=specificRows().find(x=>x.id===id),panel=activity?.row.querySelector(':scope > .prepFeedback'),area=reflectionEl();if(!activity||!panel||!area)return;
 const values=panelValues(panel),base=stripFeedback(area.value,id),block=feedbackBlock(activity,values);area.value=`${base}${base?'\n\n':''}${block}`;area.dispatchEvent(new Event('input',{bubbles:true}));panel.dataset.dirty='0';
 const out=document.getElementById('toolStatus');if(out)out.textContent='Preparation teaching evidence saved in this class reflection. It can inform the next session in this curriculum.';schedule();
}
function clearFeedback(id){
 const area=reflectionEl();if(!area)return;const next=stripFeedback(area.value,id);if(next===area.value)return;area.value=next;area.dispatchEvent(new Event('input',{bubbles:true}));const panel=specificRows().find(x=>x.id===id)?.row.querySelector(':scope > .prepFeedback');if(panel)panel.dataset.dirty='0';schedule();
}
function stripHistoryBlock(value){return String(value||'').replace(/\n*— Previous-class preparation evidence —[\s\S]*?— End previous-class preparation evidence —\n*/g,'\n').trim();}
function historyBlock(prev,items){
 const useful=items.filter(x=>x.outcome!=='not_used').slice(0,4);if(!useful.length)return'';
 const lines=useful.map(x=>`• ${x.activity}: ${outcomeLabel[x.outcome]||x.outcome}; ${versionLabel[x.version]||x.version}. Next: ${x.next}`);
 return `${HISTORY_START}\nSource session: ${prev.title||'Previous class'}\n${lines.join('\n')}\n${HISTORY_END}`;
}
function carryHistory(){
 if(!historyState?.previous)return;const block=historyBlock(historyState.previous,historyState.feedback),area=readinessEl();if(!block||!area)return;
 const base=stripHistoryBlock(area.value),next=`${base}${base?'\n\n':''}${block}`;if(next===area.value)return;area.value=next;area.dispatchEvent(new Event('input',{bubbles:true}));
}
function removeCarry(){const area=readinessEl();if(!area)return;const next=stripHistoryBlock(area.value);if(next!==area.value){area.value=next;area.dispatchEvent(new Event('input',{bubbles:true}));}const out=document.getElementById('toolStatus');if(out)out.textContent='Previous-class preparation evidence removed from this session’s readiness notes.';renderHistory();}
function renderHistory(){
 const panel=root.querySelector('.prepRecoveryPanel');if(!panel||!historyLoaded)return;let box=document.getElementById('prepTeachingHistory');
 if(!box){box=document.createElement('section');box.id='prepTeachingHistory';box.className='prepHistory';const anchor=document.getElementById('movementDemandMap')||panel.querySelector('.prepGraph');if(anchor)anchor.before(box);else panel.appendChild(box);}
 if(!historyState?.previous){box.innerHTML='<p class="kicker">TEACHING FEEDBACK LOOP</p><h4>No previous preparation evidence yet</h4><p>After you save evidence in a class, the next session in the same curriculum will inherit the useful preparation notes here.</p>';return;}
 const useful=historyState.feedback.filter(x=>x.outcome!=='not_used');
 box.innerHTML=`<p class="kicker">EVIDENCE FROM LAST CLASS</p><h4>${esc(historyState.previous.title||'Previous session')}</h4><p>This evidence is automatically carried into the current session’s readiness notes so the demand, progression and adaptation tools can use it.</p>${historyState.feedback.map(x=>`<div class="prepHistoryItem"><strong>${esc(x.activity||'Preparation activity')}</strong><span>${esc(outcomeLabel[x.outcome]||x.outcome)} · ${esc(versionLabel[x.version]||x.version)}</span>${x.observation&&x.observation!=='No additional note.'?`<p>${esc(x.observation)}</p>`:''}<small>${esc(x.next||'')}</small></div>`).join('')}${useful.length?'<button type="button" data-remove-prep-history>Remove carried evidence from this plan</button>':'<p class="toolHint">Nothing actionable was carried because the recorded preparation was not used.</p>'}`;
}
async function loadHistory(){
 if(historyLoaded)return;const sid=sessionId();if(!sid||!window.TeacherCloud?.read)return;
 try{
  const result=await window.TeacherCloud.read(),doc=result?.document,current=doc?.sessions?.find(x=>x.id===sid);if(!current){historyLoaded=true;historyState=null;renderHistory();return;}
  const course=doc.courses?.find(x=>x.id===current.courseId);if(!course){historyLoaded=true;historyState=null;renderHistory();return;}
  const index=course.sessionIds.indexOf(current.id);let previous=null,feedback=[];
  for(let i=index-1;i>=0;i--){const candidate=doc.sessions.find(x=>x.id===course.sessionIds[i]);if(!candidate)continue;const blocks=parseFeedbackBlocks(candidate.reflection||'');if(blocks.length){previous=candidate;feedback=blocks;break;}}
  historyState=previous?{previous,feedback}:null;historyLoaded=true;if(historyState)carryHistory();renderHistory();
 }catch(error){historyLoaded=true;historyState=null;renderHistory();console.warn('Preparation teaching feedback history unavailable',error);}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;installStyle();renderRows();renderHistory();if(!historyLoaded&&reflectionEl())loadHistory();});}
root.addEventListener('input',event=>{
 const panel=event.target.closest('.prepFeedback');if(panel){panel.dataset.dirty='1';updatePreview(panel);return;}
 if(event.target.matches('[data-activity][data-field="title"],[data-activity][data-field="instructions"],[data-field="adaptations"]:not([data-activity]),[data-field="reflection"]:not([data-activity])'))schedule();
});
root.addEventListener('change',event=>{const panel=event.target.closest('.prepFeedback');if(panel){panel.dataset.dirty='1';updatePreview(panel);return;}if(event.target.dataset.concept||event.target.dataset.skill||event.target.matches('select[data-field]'))schedule();});
root.addEventListener('click',event=>{
 const save=event.target.closest('[data-save-prep-feedback]');if(save){event.preventDefault();event.stopPropagation();saveFeedback(save.dataset.savePrepFeedback);return;}
 const clear=event.target.closest('[data-clear-prep-feedback]');if(clear){event.preventDefault();event.stopPropagation();clearFeedback(clear.dataset.clearPrepFeedback);return;}
 if(event.target.closest('[data-remove-prep-history]')){event.preventDefault();event.stopPropagation();removeCarry();}
});
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
})();