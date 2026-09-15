(() => {
  'use strict';
  if (!location.pathname.startsWith('/session-planner')) return;

  const params = new URLSearchParams(location.search);
  const roadmapId = params.get('roadmap');
  if (!roadmapId) return;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let client = null;

  async function waitFor(test, timeout=10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const value = test();
      if (value) return value;
      await sleep(100);
    }
    throw new Error('The Session Planner did not finish loading.');
  }

  async function getClient() {
    await waitFor(() => window.supabase && window.GAB_PORTAL?.supabaseUrl);
    if (!client) client = window.__ROADMAP_PLANNER_DB || (window.__ROADMAP_PLANNER_DB = window.supabase.createClient(window.GAB_PORTAL.supabaseUrl, window.GAB_PORTAL.supabaseAnonKey));
    return client;
  }

  async function loadContext() {
    const db = await getClient();
    const {data:{user}} = await db.auth.getUser();
    if (!user) throw new Error('Sign in to your teacher account to prepare this class.');
    const {data:me,error:meError} = await db.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if (meError) throw meError;
    if (me?.role !== 'coach') throw new Error('Coach access is required to prepare a class from a student roadmap.');

    const {data:item,error:itemError} = await db.from('mentorship_roadmap_items')
      .select('id,student_id,curriculum_node_id,title,horizon,status,reason,readiness,coach_review_state,planner_session_id,planner_session_created_at')
      .eq('id', roadmapId).maybeSingle();
    if (itemError) throw itemError;
    if (!item) throw new Error('This roadmap checkpoint is no longer available.');

    const [studentRes, profileRes, reviewRes] = await Promise.all([
      db.from('profiles').select('display_name').eq('id',item.student_id).maybeSingle(),
      db.from('mentorship_learning_profiles').select('main_goal,short_term_goal').eq('student_id',item.student_id).maybeSingle(),
      db.from('mentorship_roadmap_reviews').select('decision,note,reviewed_at,evidence_days,evidence_attempts,evidence_minutes')
        .eq('roadmap_item_id',item.id).order('reviewed_at',{ascending:false}).limit(1).maybeSingle()
    ]);
    if (studentRes.error) throw studentRes.error;
    return {
      db,
      item,
      studentName: studentRes.data?.display_name || 'Student',
      learningProfile: profileRes.data || null,
      review: reviewRes.data || null
    };
  }

  function field(name) {
    return document.querySelector(`#teachingWorkbench [data-field="${CSS.escape(name)}"]:not([data-activity])`);
  }

  function setText(name, value) {
    const el = field(name);
    if (!el || value == null) return false;
    el.value = String(value);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }

  async function setSelect(name, value) {
    const el = field(name);
    if (!el || ![...el.options].some(o => o.value === value)) return false;
    if (el.value === value) return true;
    el.value = value;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    await waitFor(() => field(name)?.value === value);
    return true;
  }

  function conceptContext(ctx) {
    const id = ctx.item.curriculum_node_id;
    if (!id) return {concept:null,details:null,supports:[]};
    const concept = window.GAB_CURRICULUM?.concept?.(id) || null;
    const details = window.ZOUK_DETAILS?.[id] || null;
    const supports = window.GAB_CURRICULUM?.prerequisites?.([id],{recursive:false,track:concept?.track}) || [];
    return {concept,details,supports};
  }

  function stageFor(ctx, concept) {
    if (ctx.item.coach_review_state === 'continue') return 'revisit';
    if (ctx.item.status === 'in_progress') return 'practice';
    return Number(concept?.tier || 1) >= 3 ? 'practice' : 'introduce';
  }

  async function createOrOpenSession(ctx) {
    const root = await waitFor(() => document.getElementById('teachingWorkbench'));
    await waitFor(() => root.querySelector('#planSelect'));
    const urlSession = new URLSearchParams(location.search).get('session');
    const stored = ctx.item.planner_session_id;

    if (urlSession) return {sessionId:urlSession,created:false};

    if (stored) {
      const select = root.querySelector('#planSelect');
      if ([...select.options].some(o => o.value === stored)) {
        select.value = stored;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        await waitFor(() => new URLSearchParams(location.search).get('session') === stored);
        return {sessionId:stored,created:false};
      }
      await ctx.db.from('mentorship_roadmap_items').update({planner_session_id:null,planner_session_created_at:null}).eq('id',ctx.item.id);
    }

    const button = await waitFor(() => root.querySelector('[data-action="new"]'));
    button.click();
    const sessionId = await waitFor(() => new URLSearchParams(location.search).get('session'));
    await ctx.db.from('mentorship_roadmap_items').update({planner_session_id:sessionId,planner_session_created_at:new Date().toISOString()}).eq('id',ctx.item.id);
    return {sessionId,created:true};
  }

  async function prefillNewSession(ctx) {
    const {concept,details,supports} = conceptContext(ctx);
    const track = concept?.track === 'lambada' ? 'lambada' : 'zouk';
    await setSelect('dance', track);
    await setSelect('stage', stageFor(ctx,concept));

    const currentDirection = ctx.learningProfile?.short_term_goal || ctx.learningProfile?.main_goal || '';
    const reviewNote = String(ctx.review?.note || '').trim();
    const learningGoal = details?.understand || (concept ? `Develop a usable understanding of ${concept.name}.` : ctx.item.reason || `Develop ${ctx.item.title}.`);
    const assessment = details?.notice || `Observe whether ${ctx.studentName} can use ${ctx.item.title} when one condition changes.`;
    const prerequisiteText = supports.length ? `Revisit/check: ${supports.map(x=>x.name).join(', ')}.` : '';
    const adaptationLines = [
      reviewNote ? `Recent coach review: ${reviewNote}` : '',
      ctx.item.reason ? `Roadmap rationale: ${ctx.item.reason}` : ''
    ].filter(Boolean).join('\n');

    setText('title', `${ctx.studentName} · ${ctx.item.title}`);
    setText('goal', learningGoal);
    setText('learners', [ctx.studentName,currentDirection?`Current direction: ${currentDirection}`:''].filter(Boolean).join('\n'));
    setText('prerequisites', prerequisiteText);
    setText('assessment', assessment);
    setText('adaptations', adaptationLines);

    if (ctx.item.curriculum_node_id) {
      const checkbox = await waitFor(() => document.querySelector(`#teachingWorkbench [data-concept="${CSS.escape(ctx.item.curriculum_node_id)}"]`),5000).catch(()=>null);
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change',{bubbles:true}));
      }
      const activityButton = document.querySelector('#teachingWorkbench [data-action="conceptActivities"]');
      if (activityButton && !document.querySelector('#teachingWorkbench [data-activity]')) activityButton.click();
    }

    if (window.TeacherPlannerFlush) setTimeout(() => window.TeacherPlannerFlush(),700);
  }

  function renderContext(ctx,sessionId) {
    let box = document.getElementById('roadmapPlannerContext');
    if (!box) {
      box = document.createElement('section');
      box.id = 'roadmapPlannerContext';
      box.className = 'w';
      document.getElementById('teachingWorkbench')?.before(box);
    }
    if (!document.getElementById('roadmapPlannerContextStyles')) {
      const style=document.createElement('style');style.id='roadmapPlannerContextStyles';style.textContent=`
        #roadmapPlannerContext{margin-top:18px;margin-bottom:2px;padding:16px 18px;border:1px solid #7dd8ff42;border-radius:18px;background:linear-gradient(135deg,#102131,#111522)}
        #roadmapPlannerContext .rpcTop{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}#roadmapPlannerContext .rpcKicker{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:#8ddfff;font-weight:900}#roadmapPlannerContext h2{font-size:1.25rem;margin:4px 0 4px;letter-spacing:-.02em}#roadmapPlannerContext p{margin:5px 0;color:#b7c0cc}#roadmapPlannerContext .rpcActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#roadmapPlannerContext a{display:inline-flex;padding:7px 10px;border-radius:999px;border:1px solid #ffffff20;background:#0b1119;font-size:.78rem;font-weight:800}#roadmapPlannerContext .rpcSignal{margin-top:9px;padding:9px 10px;border-radius:12px;background:#ffffff07;color:#d5dce5;font-size:.83rem}@media(max-width:700px){#roadmapPlannerContext .rpcTop{flex-direction:column}}
      `;document.head.appendChild(style);
    }
    const currentDirection=ctx.learningProfile?.short_term_goal||ctx.learningProfile?.main_goal||'';
    const reviewNote=String(ctx.review?.note||'').trim();
    const practice=(window.GAB_CURRICULUM_LINKS?.forConcept?.(ctx.item.curriculum_node_id)||[]).slice(0,2);
    box.innerHTML=`<div class="rpcTop"><div><div class="rpcKicker">Prepared from mentorship roadmap</div><h2>${esc(ctx.studentName)} · ${esc(ctx.item.title)}</h2>${currentDirection?`<p><strong>Current direction:</strong> ${esc(currentDirection)}</p>`:''}</div><div class="rpcActions"><a href="/mentorship-hub/?student=${encodeURIComponent(ctx.item.student_id)}#hub-roadmap">← Student roadmap</a>${ctx.item.curriculum_node_id?`<a href="/zouk-map/?student=${encodeURIComponent(ctx.item.student_id)}&concept=${encodeURIComponent(ctx.item.curriculum_node_id)}#map">Atlas ↗</a>`:''}</div></div>${reviewNote?`<div class="rpcSignal"><strong>Latest coach-review signal:</strong> ${esc(reviewNote)}</div>`:''}${practice.length?`<div class="rpcActions">${practice.map(x=>`<a href="/zoukable/?skill=${encodeURIComponent(x.skill)}">${esc(x.name)} in Zoukable ↗</a>`).join('')}</div>`:''}`;
    const u=new URL(location.href);u.searchParams.set('roadmap',ctx.item.id);u.searchParams.set('student',ctx.item.student_id);if(sessionId)u.searchParams.set('session',sessionId);history.replaceState(null,'',u);
  }

  async function boot() {
    try {
      const ctx = await loadContext();
      await waitFor(() => document.querySelector('#teachingWorkbench #planSelect'));
      const {sessionId,created} = await createOrOpenSession(ctx);
      if (created) await prefillNewSession(ctx);
      renderContext(ctx,sessionId);
    } catch (err) {
      console.warn('Roadmap → Session Planner',err);
      const status=document.getElementById('toolStatus');if(status)status.textContent=err.message||'Could not prepare this roadmap class.';
    }
  }

  setTimeout(()=>boot(),350);
})();
