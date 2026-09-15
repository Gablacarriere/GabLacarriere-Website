(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  let db=null,user=null,items=[],profiles=[],loading=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function addStyles(){
    if(document.getElementById('mentorshipEvidenceInboxStyles'))return;
    const s=document.createElement('style');s.id='mentorshipEvidenceInboxStyles';s.textContent=`
      .evidenceInbox{margin:0 0 18px;padding:17px;border:1px solid #75d7c93a;border-radius:20px;background:linear-gradient(145deg,#0f1b1c,#10151c)}
      .evidenceInboxHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}.evidenceInboxHead h3{margin:4px 0}.evidenceInboxHead p{margin:0;color:#9daab5;font-size:.88rem;max-width:700px}.evidenceInboxCount{display:grid;place-items:center;min-width:36px;height:36px;padding:0 10px;border-radius:999px;background:#75d7c914;color:#a9eee3;font-weight:900}
      .evidenceInboxList{display:grid;gap:10px}.evidenceCard{border:1px solid #ffffff14;border-radius:15px;background:#090f15;overflow:hidden}.evidenceCard[open]{border-color:#75d7c936}.evidenceCard summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:12px;padding:12px 13px}.evidenceCard summary::-webkit-details-marker{display:none}.evidenceCard summary strong{display:block;font-size:.94rem}.evidenceCard summary span{display:block;margin-top:3px;color:#8693a1;font-size:.76rem}.evidenceStatus{flex:0 0 auto;align-self:flex-start;padding:4px 7px!important;margin:0!important;border-radius:999px;border:1px solid #ffffff1e;color:#aeb8c4!important;font-size:.66rem!important;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.evidenceStatus.ready{color:#a9eee3!important;border-color:#75d7c94d}.evidenceStatus.already_synced{color:#9edfff!important;border-color:#7dd8ff48}.evidenceStatus.unmatched{color:#ffd1a4!important;border-color:#ffb86b48}.evidenceStatus.approved{color:#b9edc9!important;border-color:#8ddeaa48}.evidenceStatus.ignored{color:#777!important}
      .evidenceBody{padding:0 13px 13px;border-top:1px solid #ffffff0d}.evidenceBody h4{margin:12px 0 4px;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;color:#8fa0b1}.evidenceBody p{margin:0;color:#c0c8d1;font-size:.84rem;line-height:1.45}.evidenceBody .evidenceNext{color:#e5d7ff}.evidenceSystemState{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.evidenceSystemState span{padding:5px 7px;border-radius:999px;background:#ffffff08;color:#98a5b2;font-size:.69rem;font-weight:800}.evidenceActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.evidenceActions button{min-height:35px;padding:7px 11px;border:1px solid #ffffff1f;border-radius:999px;background:#101820;color:#fff;font:inherit;font-size:.76rem;font-weight:850;cursor:pointer}.evidenceActions button.primary{background:#dff5ef;color:#10201d;border-color:#dff5ef}.evidenceActions button:disabled{opacity:.5;cursor:not-allowed}.evidenceMatch{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:10px}.evidenceMatch select{min-width:0;width:100%;padding:8px 9px;border-radius:10px;border:1px solid #ffffff20;background:#080d13;color:#fff;font:inherit}.evidenceResult{min-height:18px;margin-top:7px;color:#8fa0b1;font-size:.75rem}
      @media(max-width:600px){.evidenceInboxHead,.evidenceCard summary{flex-direction:column;align-items:flex-start}.evidenceMatch{grid-template-columns:1fr}.evidenceActions button{flex:1 1 auto}}
    `;document.head.appendChild(s);
  }

  async function client(){
    while(!window.supabase||!window.GAB_PORTAL?.supabaseUrl)await sleep(100);
    if(!db)db=window.__MENTORSHIP_EVIDENCE_DB||(window.__MENTORSHIP_EVIDENCE_DB=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey));
    return db;
  }

  async function load(){
    if(loading)return;loading=true;
    try{
      const c=await client(),auth=await c.auth.getUser();user=auth.data?.user||null;if(!user)return;
      const me=await c.from('profiles').select('role').eq('id',user.id).maybeSingle();if(me.data?.role!=='coach')return;
      const [inboxRes,profilesRes]=await Promise.all([
        c.from('mentorship_evidence_inbox').select('*').order('source_date',{ascending:false}).order('created_at',{ascending:false}).limit(100),
        c.from('profiles').select('id,display_name,email,role').order('display_name',{ascending:true})
      ]);
      if(inboxRes.error)throw inboxRes.error;if(profilesRes.error)throw profilesRes.error;
      items=inboxRes.data||[];profiles=(profilesRes.data||[]).filter(p=>p.role!=='coach');render();
    }catch(err){console.warn('Teaching evidence inbox',err);}finally{loading=false;}
  }

  function statusLabel(status){return({ready:'New evidence',already_synced:'Atlas synced',unmatched:'Unmatched student',approved:'Applied',ignored:'Ignored',needs_review:'Needs review'})[status]||status;}
  function fmtDate(v){try{return new Date(`${v}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'});}catch{return v||'';}}
  function systemBadges(item){
    const x=item.extraction||{},out=[];
    if(item.atlas_lesson_id||x.atlas==='already_synced')out.push('Atlas evidence ✓');
    if(x.zoukable_homework==='already_assigned')out.push(`Zoukable homework ✓${x.homework_assignments?` · ${x.homework_assignments}`:''}`);
    else if((item.homework_drill_ids||[]).length)out.push(`${item.homework_drill_ids.length} mapped homework drill${item.homework_drill_ids.length===1?'':'s'}`);
    if(item.next_focus)out.push('Roadmap next-focus available');
    return out.map(t=>`<span>${esc(t)}</span>`).join('');
  }
  function profileOptions(item){return `<option value="">Choose a member account…</option>${profiles.map(p=>`<option value="${esc(p.id)}">${esc(p.display_name||p.email||'Member')} · ${esc(p.email||'')}</option>`).join('')}`;}
  function actionLabel(item){return item.status==='already_synced'?'Apply missing pieces':'Apply to Atlas · Roadmap · Zoukable';}

  function card(item){
    const canApply=['ready','already_synced','needs_review'].includes(item.status)&&item.student_id;
    const ignored=item.status==='ignored',approved=item.status==='approved';
    return `<details class="evidenceCard" data-evidence-id="${esc(item.id)}" ${item.status==='ready'||item.status==='unmatched'?'open':''}>
      <summary><div><strong>${esc(item.student_name||'Unknown student')} · ${esc(item.source_title.replace(/\s*\/\s*Gab Lacarriere.*$/i,''))}</strong><span>${esc(fmtDate(item.source_date))} · ${esc(item.source_type)}</span></div><span class="evidenceStatus ${esc(item.status)}">${esc(statusLabel(item.status))}</span></summary>
      <div class="evidenceBody">
        ${item.summary?`<h4>Class evidence</h4><p>${esc(item.summary)}</p>`:''}
        ${item.corrections?`<h4>Corrections / observations</h4><p>${esc(item.corrections)}</p>`:''}
        ${item.homework?`<h4>Explicit homework</h4><p>${esc(item.homework)}</p>`:''}
        ${item.next_focus?`<h4>Likely next direction</h4><p class="evidenceNext">${esc(item.next_focus)}</p>`:''}
        <div class="evidenceSystemState">${systemBadges(item)}</div>
        ${item.status==='unmatched'?`<div class="evidenceMatch"><select data-match-profile>${profileOptions(item)}</select><button type="button" data-link-student>Link student</button></div><p class="evidenceResult">No member profile was matched automatically. Nothing will be written to a student record until you link one.</p>`:''}
        <div class="evidenceActions">
          ${canApply&&!approved&&!ignored?`<button type="button" class="primary" data-approve-evidence>${esc(actionLabel(item))}</button>`:''}
          ${item.student_id?`<button type="button" data-open-evidence-student>Open student</button>`:''}
          ${!approved&&!ignored?`<button type="button" data-ignore-evidence>Ignore</button>`:''}
          ${ignored?`<button type="button" data-restore-evidence>Restore</button>`:''}
        </div><div class="evidenceResult" role="status"></div>
      </div>
    </details>`;
  }

  function render(){
    const unresolved=items.filter(x=>!['approved','ignored'].includes(x.status)).length;
    let root=document.getElementById('mentorshipEvidenceInbox');
    const host=document.getElementById('roadmapFleetOverview')||document.querySelector('.adminOnly')||document.getElementById('coachEditor');if(!host)return;
    if(!root){root=document.createElement('section');root.id='mentorshipEvidenceInbox';root.className='evidenceInbox';host.prepend(root);}else if(root.parentElement!==host)host.prepend(root);
    root.innerHTML=`<div class="evidenceInboxHead"><div><span class="badge">Teaching evidence inbox</span><h3>Granola → Mothership</h3><p>Review class evidence before it changes a student record. Approval is deduplicated across Atlas, Roadmap and Zoukable.</p></div><span class="evidenceInboxCount">${unresolved}</span></div><div class="evidenceInboxList">${items.length?items.map(card).join(''):'<p class="empty">No teaching evidence is waiting.</p>'}</div>`;
    bind(root);
  }

  function result(card,text){const el=card.querySelector('.evidenceResult:last-child');if(el)el.textContent=text;}
  async function approve(card,id){
    const btn=card.querySelector('[data-approve-evidence]');if(btn)btn.disabled=true;result(card,'Applying evidence…');
    const {data,error}=await db.rpc('approve_mentorship_evidence',{p_inbox_id:id});
    if(error){if(btn)btn.disabled=false;result(card,error.message);return;}
    const pieces=[];if(data?.atlas_created)pieces.push('Atlas lesson created');else pieces.push('Atlas already current');if(data?.roadmap_created)pieces.push('Roadmap updated');if(Number(data?.homework_assignments_created||0))pieces.push(`${data.homework_assignments_created} homework assignment${data.homework_assignments_created===1?'':'s'} added`);if(!pieces.length)pieces.push('Reviewed');result(card,pieces.join(' · '));setTimeout(load,400);
  }
  async function setStatus(card,id,status){
    result(card,status==='ignored'?'Ignoring…':'Restoring…');const patch={status,updated_at:new Date().toISOString()};if(status==='ignored'){patch.reviewed_by=user.id;patch.reviewed_at=new Date().toISOString();}else{patch.reviewed_by=null;patch.reviewed_at=null;}
    const {error}=await db.from('mentorship_evidence_inbox').update(patch).eq('id',id);if(error){result(card,error.message);return;}load();
  }
  async function linkStudent(card,id){
    const studentId=card.querySelector('[data-match-profile]')?.value;if(!studentId){result(card,'Choose a member account first.');return;}result(card,'Linking student…');
    const {error}=await db.from('mentorship_evidence_inbox').update({student_id:studentId,status:'ready',updated_at:new Date().toISOString()}).eq('id',id);if(error){result(card,error.message);return;}load();
  }
  function openStudent(item){
    const b=document.querySelector(`[data-student="${CSS.escape(String(item.student_id))}"]`);b?.click();setTimeout(()=>document.getElementById('coachRoadmapPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),180);
  }
  function bind(root){
    root.querySelectorAll('[data-evidence-id]').forEach(card=>{
      const id=card.dataset.evidenceId,item=items.find(x=>String(x.id)===String(id));if(!item)return;
      card.querySelector('[data-approve-evidence]')?.addEventListener('click',()=>approve(card,id));
      card.querySelector('[data-ignore-evidence]')?.addEventListener('click',()=>setStatus(card,id,'ignored'));
      card.querySelector('[data-restore-evidence]')?.addEventListener('click',()=>setStatus(card,id,item.student_id?'ready':'unmatched'));
      card.querySelector('[data-link-student]')?.addEventListener('click',()=>linkStudent(card,id));
      card.querySelector('[data-open-evidence-student]')?.addEventListener('click',()=>openStudent(item));
    });
  }

  async function boot(){
    addStyles();await load();window.addEventListener('focus',()=>load());document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
    const root=document.getElementById('dashboardView')||document.body;let timer=null;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{if(items.length)render();},120);}).observe(root,{childList:true,subtree:true});
  }
  setTimeout(()=>boot().catch(err=>console.warn('Teaching evidence inbox boot',err)),1350);
})();
