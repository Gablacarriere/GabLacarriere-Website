(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let db = null, user = null, items = [], profiles = [], loading = false, activeFilter = 'attention';

  async function client() {
    while (!window.supabase || !window.GAB_PORTAL?.supabaseUrl) await sleep(100);
    if (!db) db = window.__MENTORSHIP_EVIDENCE_DB || (window.__MENTORSHIP_EVIDENCE_DB = window.supabase.createClient(window.GAB_PORTAL.supabaseUrl, window.GAB_PORTAL.supabaseAnonKey));
    return db;
  }

  function addStyles() {
    if (document.getElementById('mentorshipEvidenceInboxStyles')) return;
    const s = document.createElement('style');
    s.id = 'mentorshipEvidenceInboxStyles';
    s.textContent = `
      .evidenceInbox{margin:0 0 18px;padding:17px;border:1px solid #75d7c93a;border-radius:20px;background:linear-gradient(145deg,#0f1b1c,#10151c)}
      .evidenceInboxHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}.evidenceInboxHead h3{margin:4px 0}.evidenceInboxHead p{margin:0;color:#9daab5;font-size:.88rem;max-width:700px}.evidenceInboxCount{display:grid;place-items:center;min-width:36px;height:36px;padding:0 10px;border-radius:999px;background:#75d7c914;color:#a9eee3;font-weight:900}
      .evidenceFilters{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 12px}.evidenceFilters button{padding:7px 10px;border-radius:999px;border:1px solid #ffffff1d;background:#0b1119;color:#cbd3df;font:inherit;font-size:.75rem;font-weight:850;cursor:pointer}.evidenceFilters button.active{border-color:#75d7c9;color:#fff;background:#122425}
      .evidenceInboxList{display:grid;gap:10px}.evidenceCard{border:1px solid #ffffff14;border-radius:15px;background:#090f15;overflow:hidden}.evidenceCard[open]{border-color:#75d7c936}.evidenceCard summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:12px;padding:12px 13px}.evidenceCard summary::-webkit-details-marker{display:none}.evidenceCard summary strong{display:block;font-size:.94rem}.evidenceCard summary span{display:block;margin-top:3px;color:#8693a1;font-size:.76rem}.evidenceStatus{flex:0 0 auto;align-self:flex-start;padding:4px 7px!important;margin:0!important;border-radius:999px;border:1px solid #ffffff1e;color:#aeb8c4!important;font-size:.66rem!important;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.evidenceStatus.ready,.evidenceStatus.needs_review{color:#a9eee3!important;border-color:#75d7c94d}.evidenceStatus.already_synced{color:#9edfff!important;border-color:#7dd8ff48}.evidenceStatus.unmatched{color:#ffd1a4!important;border-color:#ffb86b48}.evidenceStatus.approved{color:#b9edc9!important;border-color:#8ddeaa48}.evidenceStatus.ignored{color:#777!important}
      .evidenceBody{padding:0 13px 13px;border-top:1px solid #ffffff0d}.evidenceSystemState{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.evidenceSystemState span{padding:5px 7px;border-radius:999px;background:#ffffff08;color:#98a5b2;font-size:.69rem;font-weight:800}.evidenceSystemState .ok{color:#b9edc9;background:#8ddeaa10}.evidenceSystemState .warn{color:#ffd1a4;background:#ffb86b10}
      .evidenceEditGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.evidenceField{display:grid;gap:5px}.evidenceField.full{grid-column:1/-1}.evidenceField span{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#8493a3;font-weight:850}.evidenceField textarea,.evidenceField input,.evidenceField select{width:100%;border:1px solid #ffffff1a;border-radius:10px;background:#070c12;color:#fff;padding:9px 10px;font:inherit}.evidenceField textarea{min-height:78px;resize:vertical}.evidenceField select{min-width:0}
      .evidenceActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.evidenceActions button{min-height:35px;padding:7px 11px;border:1px solid #ffffff1f;border-radius:999px;background:#101820;color:#fff;font:inherit;font-size:.76rem;font-weight:850;cursor:pointer}.evidenceActions button.primary{background:#dff5ef;color:#10201d;border-color:#dff5ef}.evidenceActions button.secondary{border-color:#7dd8ff55;color:#bceaff}.evidenceActions button.danger{border-color:#ff8c8c44;color:#ffbbbb}.evidenceActions button:disabled{opacity:.5;cursor:not-allowed}.evidenceResult{min-height:18px;margin-top:7px;color:#8fa0b1;font-size:.75rem}.evidenceEmpty{color:#8793a1;font-style:italic}
      @media(max-width:700px){.evidenceInboxHead,.evidenceCard summary{flex-direction:column;align-items:flex-start}.evidenceEditGrid{grid-template-columns:1fr}.evidenceField.full{grid-column:auto}.evidenceActions button{flex:1 1 auto}}
    `;
    document.head.appendChild(s);
  }

  function fmtDate(v){try{return new Date(`${v}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'});}catch{return v||'';}}
  function statusLabel(status){return({ready:'New evidence',already_synced:'Already synced',unmatched:'Unmatched student',approved:'Applied',ignored:'Ignored',needs_review:'Needs review'})[status]||status||'Pending';}

  function profileOptions(selected) {
    return `<option value="">Unmatched</option>${profiles.map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.display_name||p.email||'Member')} · ${esc(p.email||'')}</option>`).join('')}`;
  }

  function systemBadges(item) {
    const x=item.extraction||{}, out=[];
    const atlasOk=!!item.atlas_lesson_id||x.atlas==='already_synced';
    out.push(`<span class="${atlasOk?'ok':'warn'}">Atlas ${atlasOk?'✓':'pending'}</span>`);
    const homeworkCount=(item.homework_drill_ids||[]).length;
    const homeworkOk=x.zoukable_homework==='already_assigned'||Number(x.homework_assignments||0)>0||homeworkCount===0;
    out.push(`<span class="${homeworkOk?'ok':'warn'}">Homework ${homeworkCount===0?'—':homeworkOk?'✓':`${homeworkCount} mapped`}</span>`);
    out.push(`<span class="${item.next_focus?'warn':'ok'}">${item.next_focus?'Roadmap focus available':'No next focus stated'}</span>`);
    return out.join('');
  }

  function card(item) {
    const canApply=!!item.student_id&&item.status!=='ignored';
    const label=item.status==='already_synced'?'Apply missing pieces':item.status==='approved'?'Re-apply safely':'Approve';
    return `<details class="evidenceCard" data-evidence-id="${esc(item.id)}" ${['ready','needs_review','unmatched'].includes(item.status)?'open':''}>
      <summary><div><strong>${esc(item.student_name||'Unknown student')} · ${esc(String(item.source_title||'').replace(/\s*\/\s*Gab Lacarriere.*$/i,''))}</strong><span>${esc(fmtDate(item.source_date))} · ${esc(item.source_type||'Granola')}</span></div><span class="evidenceStatus ${esc(item.status)}">${esc(statusLabel(item.status))}</span></summary>
      <div class="evidenceBody">
        <div class="evidenceSystemState">${systemBadges(item)}</div>
        <div class="evidenceEditGrid">
          <label class="evidenceField full"><span>Student match</span><select name="student_id">${profileOptions(item.student_id)}</select></label>
          <label class="evidenceField full"><span>Class summary</span><textarea name="summary">${esc(item.summary||'')}</textarea></label>
          <label class="evidenceField full"><span>Corrections / observations</span><textarea name="corrections">${esc(item.corrections||'')}</textarea></label>
          <label class="evidenceField full"><span>Explicit homework only</span><textarea name="homework">${esc(item.homework||'')}</textarea></label>
          <label class="evidenceField"><span>Next class focus</span><input name="next_focus" value="${esc(item.next_focus||'')}"></label>
          <label class="evidenceField"><span>Curriculum node ID</span><input name="next_focus_node_id" value="${esc(item.next_focus_node_id||'')}" placeholder="Optional"></label>
        </div>
        ${!item.student_id?'<p class="evidenceResult">No member profile was matched automatically. Nothing will be written to a student record until you link one.</p>':''}
        <div class="evidenceActions">
          <button type="button" class="secondary" data-save-evidence>Save edits</button>
          <button type="button" class="primary" data-approve-evidence ${canApply?'':'disabled'}>${esc(label)}</button>
          ${item.status==='ignored'?'<button type="button" data-restore-evidence>Restore</button>':'<button type="button" class="danger" data-ignore-evidence>Ignore</button>'}
          ${item.student_id?'<button type="button" data-open-evidence-student>Open student</button>':''}
        </div><div class="evidenceResult" role="status"></div>
      </div>
    </details>`;
  }

  function ensureRoot(){
    let root=document.getElementById('mentorshipEvidenceInbox');
    const host=document.getElementById('roadmapFleetOverview')||document.querySelector('.adminOnly')||document.getElementById('coachEditor');
    if(!host)return null;
    if(!root){root=document.createElement('section');root.id='mentorshipEvidenceInbox';root.className='evidenceInbox';host.prepend(root);}else if(root.parentElement!==host)host.prepend(root);
    return root;
  }

  function filtered(){
    if(activeFilter==='done')return items.filter(x=>['approved','ignored'].includes(x.status));
    if(activeFilter==='all')return items;
    return items.filter(x=>!['approved','ignored'].includes(x.status));
  }

  function render(){
    const root=ensureRoot(); if(!root)return;
    const unresolved=items.filter(x=>!['approved','ignored'].includes(x.status)).length;
    const shown=filtered();
    root.innerHTML=`<div class="evidenceInboxHead"><div><span class="badge">Teaching evidence inbox</span><h3>Granola → Mothership</h3><p>Edit before approval. Approval is deduplicated across Atlas, Roadmap and Zoukable, and qualitative notes never create a readiness score.</p></div><span class="evidenceInboxCount">${unresolved}</span></div>
      <div class="evidenceFilters"><button data-evidence-filter="attention" class="${activeFilter==='attention'?'active':''}">Needs attention</button><button data-evidence-filter="done" class="${activeFilter==='done'?'active':''}">Reviewed</button><button data-evidence-filter="all" class="${activeFilter==='all'?'active':''}">All</button></div>
      <div class="evidenceInboxList">${shown.length?shown.map(card).join(''):'<p class="evidenceEmpty">No evidence items in this view.</p>'}</div>`;
    bind(root);
  }

  async function load(){
    if(loading)return; loading=true;
    try{
      const c=await client(),auth=await c.auth.getUser(); user=auth.data?.user||null; if(!user)return;
      const me=await c.from('profiles').select('role').eq('id',user.id).maybeSingle(); if(me.data?.role!=='coach')return;
      const [inboxRes,profilesRes]=await Promise.all([
        c.from('mentorship_evidence_inbox').select('*').order('source_date',{ascending:false}).order('created_at',{ascending:false}).limit(100),
        c.from('profiles').select('id,display_name,email,role').order('display_name',{ascending:true})
      ]);
      if(inboxRes.error)throw inboxRes.error; if(profilesRes.error)throw profilesRes.error;
      items=inboxRes.data||[]; profiles=(profilesRes.data||[]).filter(p=>p.role!=='coach'); render();
    }catch(err){console.warn('Teaching evidence inbox',err);}finally{loading=false;}
  }

  function message(card,text){const el=card.querySelector('.evidenceResult:last-child');if(el)el.textContent=text;}
  function payload(card){
    const studentId=card.querySelector('[name="student_id"]')?.value||null;
    const student=profiles.find(p=>p.id===studentId);
    return {student_id:studentId,student_name:student?.display_name||student?.email||null,student_email:student?.email||null,summary:card.querySelector('[name="summary"]')?.value.trim()||null,corrections:card.querySelector('[name="corrections"]')?.value.trim()||null,homework:card.querySelector('[name="homework"]')?.value.trim()||null,next_focus:card.querySelector('[name="next_focus"]')?.value.trim()||null,next_focus_node_id:card.querySelector('[name="next_focus_node_id"]')?.value.trim()||null,updated_at:new Date().toISOString()};
  }
  async function save(card,quiet=false){
    if(!quiet)message(card,'Saving…'); const patch=payload(card); const {error}=await db.from('mentorship_evidence_inbox').update(patch).eq('id',card.dataset.evidenceId); if(error){message(card,error.message);throw error;} if(!quiet)message(card,'Saved.'); return patch;
  }
  async function approve(card){
    const btn=card.querySelector('[data-approve-evidence]');if(btn)btn.disabled=true;message(card,'Checking and applying only missing pieces…');
    try{
      const patch=await save(card,true); if(!patch.student_id)throw new Error('Match this note to a mentorship student first.');
      const {data,error}=await db.rpc('approve_mentorship_evidence',{p_inbox_id:card.dataset.evidenceId}); if(error)throw error;
      const pieces=[];pieces.push(data?.atlas_created?'Atlas lesson created':'Atlas already covered'); if(data?.roadmap_created)pieces.push('Roadmap stop added'); else if(data?.roadmap_item_id)pieces.push('Roadmap already covered'); const n=Number(data?.homework_assignments_created||0); pieces.push(n?`${n} homework assignment${n===1?'':'s'} added`:'Homework unchanged'); message(card,pieces.join(' · ')); setTimeout(load,600);
    }catch(err){message(card,err.message||String(err));if(btn)btn.disabled=false;}
  }
  async function setStatus(card,status){
    message(card,status==='ignored'?'Ignoring…':'Restoring…'); const patch={status,updated_at:new Date().toISOString(),reviewed_by:status==='ignored'?user.id:null,reviewed_at:status==='ignored'?new Date().toISOString():null}; const {error}=await db.from('mentorship_evidence_inbox').update(patch).eq('id',card.dataset.evidenceId); if(error){message(card,error.message);return;} load();
  }
  function openStudent(item){document.querySelector('[data-mode="coach"]')?.click();document.querySelector(`[data-student="${CSS.escape(String(item.student_id))}"]`)?.click();setTimeout(()=>document.getElementById('coachRoadmapPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),180);}

  function bind(root){
    root.querySelectorAll('[data-evidence-filter]').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.evidenceFilter;render();});
    root.querySelectorAll('[data-evidence-id]').forEach(card=>{
      const item=items.find(x=>String(x.id)===String(card.dataset.evidenceId));if(!item)return;
      card.querySelector('[data-save-evidence]')?.addEventListener('click',()=>save(card).catch(console.warn));
      card.querySelector('[data-approve-evidence]')?.addEventListener('click',()=>approve(card));
      card.querySelector('[data-ignore-evidence]')?.addEventListener('click',()=>setStatus(card,'ignored'));
      card.querySelector('[data-restore-evidence]')?.addEventListener('click',()=>setStatus(card,item.student_id?'needs_review':'unmatched'));
      card.querySelector('[data-open-evidence-student]')?.addEventListener('click',()=>openStudent(item));
      card.querySelector('[name="student_id"]')?.addEventListener('change',e=>{const btn=card.querySelector('[data-approve-evidence]');if(btn)btn.disabled=!e.target.value;});
    });
  }

  async function boot(){
    addStyles(); await load(); window.addEventListener('focus',()=>load()); document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
    const root=document.getElementById('dashboardView')||document.body; let timer=null; new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{if(items.length)render();},120);}).observe(root,{childList:true,subtree:true});
  }
  setTimeout(()=>boot().catch(err=>console.warn('Teaching evidence inbox boot',err)),1350);
})();
