(() => {
  'use strict';
  const root = document.getElementById('teachingWorkbench');
  const METHOD = window.GAB_METHODOLOGY;
  if (!root || !METHOD) return;

  const CURR = window.GAB_CURRICULUM;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val = key => root.querySelector(`[data-field="${key}"]`)?.value?.trim() || '';
  const checkedConcepts = () => [...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(el => el.dataset.concept);
  const field = key => root.querySelector(`[data-field="${key}"]`);
  const hasDomain = (text, domain) => new RegExp(`(^|\\n)\\s*${domain}\\s*:`, 'im').test(text || '');

  function item(label, ok, prompt) {
    return `<li class="methodologyCheck ${ok ? 'methodologyOk' : 'methodologyPrompt'}"><span aria-hidden="true">${ok ? '✓' : '○'}</span><div><strong>${esc(label)}</strong>${prompt ? `<small>${esc(prompt)}</small>` : ''}</div></li>`;
  }

  function selectedAdvancedConcept() {
    if (!CURR?.concept) return false;
    return checkedConcepts().some(id => METHOD.safety.advancedFamilies.includes(CURR.concept(id)?.family));
  }

  function setField(key, value) {
    const el = field(key);
    if (!el) return false;
    el.value = value;
    el.dispatchEvent(new Event('input', {bubbles:true}));
    return true;
  }

  function applyOutcomeTemplate() {
    const isCourse = root.dataset.tool === 'curriculum-planner';
    const key = isCourse ? 'goals' : 'goal';
    const current = val(key);
    const missing = METHOD.outcomeDomains.filter(d => !hasDomain(current, d.name));
    if (!missing.length) return;
    let next = current;
    if (current && !METHOD.outcomeDomains.some(d => hasDomain(current, d.name))) {
      next = `${isCourse ? 'Overall direction' : 'Primary learning focus'}: ${current}`;
    }
    const additions = missing.map(d => `${d.name}: `).join('\n');
    next = `${next ? next.trim() + '\n\n' : ''}${additions}`;
    setField(key, next);
    field(key)?.focus();
  }

  function applyReflectionTemplate() {
    const current = val('reflection');
    const missing = METHOD.reflectionLoop.fields.filter(label => !new RegExp(`(^|\\n)\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'im').test(current));
    if (!missing.length) return;
    const additions = missing.map(label => `${label}: `).join('\n');
    const next = `${current ? current.trim() + '\n\n' : ''}${additions}`;
    setField('reflection', next);
    field('reflection')?.focus();
  }

  function activityInputs() {
    return [...root.querySelectorAll('[data-activity][data-field="title"]')].map(title => {
      const id = title.dataset.activity;
      return {
        id,
        title,
        minutes: root.querySelector(`[data-activity="${CSS.escape(id)}"][data-field="minutes"]`),
        instructions: root.querySelector(`[data-activity="${CSS.escape(id)}"][data-field="instructions"]`)
      };
    });
  }

  function setActivity(row, template) {
    if (!row) return;
    row.title.value = template.title;
    row.title.dispatchEvent(new Event('input', {bubbles:true}));
    if (row.minutes) {
      row.minutes.value = String(template.minutes);
      row.minutes.dispatchEvent(new Event('input', {bubbles:true}));
    }
    if (row.instructions) {
      row.instructions.value = template.instructions;
      row.instructions.dispatchEvent(new Event('input', {bubbles:true}));
    }
  }

  function buildArchitecture() {
    if (root.dataset.tool !== 'session-planner' || activityInputs().length) return;
    const add = () => root.querySelector('[data-action="addActivity"]')?.click();
    for (let i = 0; i < 6; i++) add();

    const goal = val('goal').replace(/\s+/g, ' ').trim();
    const target = goal || 'State one observable learning target for the class.';
    const templates = [
      {
        title:'Mental arrival & learning intention', minutes:3,
        instructions:`Focus attention and establish the context of the class. Name the primary learning target: ${target} Briefly orient learners to the relevant technical, social and personal outcomes.`
      },
      {
        title:'General warm-up · whole-body readiness', minutes:8,
        instructions:'Raise overall physical readiness progressively. Move the whole body and major regions through comfortable ranges; use simple, easy-to-copy movement and dynamic preparation rather than turning the warm-up into the main technical lesson.'
      },
      {
        title:'Specific warm-up · prepare the class demand', minutes:9,
        instructions:'Prepare the exact ranges of motion, tissues, coordination, rhythm, connection states and supporting mechanisms required by the main class. Rehearse simplified pieces of the later task without adding unnecessary complexity.'
      },
      {
        title:'Main learning · understand, feel & focused practice', minutes:20,
        instructions:`Teach the target mechanism with one useful model or observable question, then give learners a contrast they can notice or feel. Protect enough repetitions around one primary variable. Feedback loop: observe something specific → give one concrete next action → let the learner reattempt → return and check what changed. Target: ${target}`
      },
      {
        title:'Integration & transfer · vary one condition', minutes:15,
        instructions:'Change one meaningful condition—partner, side, role, speed, range, rhythm, constraint or social context—and observe whether the underlying skill survives. If the foundation disappears, reduce complexity and rebuild it rather than adding more material.'
      },
      {
        title:'Cool-down, retrieval & reflection', minutes:5,
        instructions:'Lower physical and cognitive intensity deliberately and return to comfortable movement. Before giving the answer again, ask learners to retrieve one key idea, sensation or decision from memory. Close by identifying what should be revisited next.'
      }
    ];

    const rows = activityInputs();
    templates.forEach((template, i) => setActivity(rows[i], template));
    setField('duration', '60');
    const status = document.getElementById('toolStatus');
    if (status) status.textContent = '60-minute methodology structure added. Adjust the timings and tasks to the dancers in front of you.';
  }

  function sessionAudit() {
    const activities = activityInputs().map(row => ({title:row.title.value || '', instructions:row.instructions?.value || ''}));
    const roles = new Set(activities.flatMap(a => METHOD.activityRole(a.title, a.instructions)));
    const activityText = activities.map(a => `${a.title} ${a.instructions}`).join(' ').toLowerCase();
    const goalText = val('goal');
    const goal = !!goalText;
    const assessment = !!val('assessment');
    const adaptations = !!val('adaptations');
    const readiness = !!val('readiness');
    const reflection = val('reflection');
    const advanced = selectedAdvancedConcept();
    const feedbackClosed = /(feedback|correction|concrete cue|next action).{0,100}(reattempt|re-attempt|next attempt|try again|follow[- ]?up|check what changed)/i.test(activityText)
      || /(reattempt|re-attempt|next attempt|try again).{0,100}(follow[- ]?up|check what changed)/i.test(activityText);

    const checks = [
      ['Clear primary learning target', goal, 'Name what learners should understand or be able to do, not only the pattern being taught.'],
      ['Technical outcome', hasDomain(goalText, 'Technical'), METHOD.outcomeDomains.find(d => d.id === 'technical')?.prompt],
      ['Social outcome', hasDomain(goalText, 'Social'), METHOD.outcomeDomains.find(d => d.id === 'social')?.prompt],
      ['Personal outcome', hasDomain(goalText, 'Personal'), METHOD.outcomeDomains.find(d => d.id === 'personal')?.prompt],
      ['Mental arrival', roles.has('mental-arrival'), METHOD.section('mental-arrival')?.purpose],
      ['General warm-up', roles.has('general-warmup'), METHOD.warmup.general],
      ['Specific warm-up', roles.has('specific-warmup'), METHOD.warmup.specific],
      ['Understand / model', roles.has('understand') || goal, 'Give learners a simple model or observable question for the target mechanism.'],
      ['Feel / discriminate', roles.has('feel'), 'Include a task that helps learners notice a relevant sensation, contrast, timing, weight, tone or connection quality.'],
      ['Focused practice', roles.has('practice'), 'Protect enough repetitions around one primary variable or question.'],
      ['Closed feedback loop', feedbackClosed, METHOD.feedbackLoop.prompt],
      ['Variation & transfer', roles.has('adapt'), 'Change one meaningful condition and test whether the skill survives.'],
      ['Retrieval during learning', roles.has('retrieve'), 'Ask learners to reconstruct or self-assess before supplying the answer again.'],
      ['Adaptations & alternatives', adaptations, 'Plan a regression, challenge, alternative or neutral option for different needs.'],
      ['Evidence of learning', assessment, 'Define what you will observe to distinguish learning from temporary imitation.'],
      ['Cool-down / recovery', roles.has('cooldown'), METHOD.section('cooldown')?.purpose || 'Close the physical session deliberately.'],
      ['Post-class comparison', !!reflection, METHOD.reflectionLoop.prompt]
    ];
    if (advanced) checks.push(['Readiness / consent for advanced material', readiness, 'For head movement or off-axis work, record observed readiness, consent and an on-axis or neutral alternative.']);

    return checks;
  }

  function courseAudit() {
    const sessionLinks = new Set([...root.querySelectorAll('a[href*="/session-planner/?session="]')].map(a => a.href));
    const stageText = [...root.querySelectorAll('.toolRowTop span')].map(el => el.textContent.toLowerCase()).join(' ');
    const goals = val('goals');
    const targets = checkedConcepts().length;
    const checks = [
      ['End-state learning goals', !!goals, 'Describe what learners should be able to perceive, organize or do by the end of the curriculum.'],
      ['Technical outcome', hasDomain(goals, 'Technical'), METHOD.outcomeDomains.find(d => d.id === 'technical')?.prompt],
      ['Social outcome', hasDomain(goals, 'Social'), METHOD.outcomeDomains.find(d => d.id === 'social')?.prompt],
      ['Personal outcome', hasDomain(goals, 'Personal'), METHOD.outcomeDomains.find(d => d.id === 'personal')?.prompt],
      ['Starting point / prerequisites', !!val('prerequisites'), 'Define what should be available or checked before the progression begins.'],
      ['Evidence of progress', !!val('assessment'), 'Use observable evidence and transfer, not attendance or pattern count alone.'],
      ['Canonical curriculum targets', targets > 0, 'Choose the reusable concepts this curriculum is actually designed to develop.'],
      ['Progressive session sequence', sessionLinks.size > 1, 'Build enough sessions for introduction, practice, revisiting and transfer rather than a single exposure.'],
      ['Revisit / retrieval opportunity', stageText.includes('revisit'), 'Include later retrieval or revisiting so earlier material must be reconstructed after delay.'],
      ['Transfer opportunity', stageText.includes('transfer'), 'Include a session where skills are tested under meaningful variation or closer-to-social conditions.']
    ];
    return checks;
  }

  function renderAudit() {
    if (!root.querySelector('#planSelect') || root.querySelector('.toolEmpty')) {
      root.querySelector('#methodologyAudit')?.remove();
      return;
    }
    const isCourse = root.dataset.tool === 'curriculum-planner';
    const starter = !isCourse ? root.querySelector('button[data-action="starter"]') : null;
    if (starter) {
      starter.textContent = 'Use methodology 60-minute structure';
      starter.title = 'Mental arrival → general warm-up → specific warm-up → main learning → transfer → cool-down/reflection';
    }

    const checks = isCourse ? courseAudit() : sessionAudit();
    const covered = checks.filter(x => x[1]).length;
    const pct = Math.round((covered / checks.length) * 100);
    const signature = JSON.stringify(checks.map(x => [x[0],x[1]]));
    let panel = root.querySelector('#methodologyAudit');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'methodologyAudit';
      panel.className = 'toolPanel methodologyAudit';
      root.append(panel);
    }
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;
    panel.innerHTML = `<p class="kicker">GAB LACARRIERE METHODOLOGY · ${esc(METHOD.version)}</p>
      <div class="methodologyHeading"><div><h2>Methodology audit</h2><p class="toolHint">A planning lens, not a score for teacher quality. Missing items are prompts to consider, not automatic errors.</p></div><strong>${covered}/${checks.length} · ${pct}%</strong></div>
      <div class="methodologyActions"><button type="button" data-method-action="outcomes">Add technical / social / personal outcome template</button>${isCourse ? '' : '<button type="button" data-method-action="reflection">Add post-class reflection template</button>'}</div>
      <ul class="methodologyChecks">${checks.map(c => item(...c)).join('')}</ul>
      <details class="methodologyQuestions"><summary>Teacher-design questions</summary><ol>${METHOD.teacherQuestions.map(q => `<li>${esc(q)}</li>`).join('')}</ol><p><a class="toolLink" href="/method/">Open the public Method overview ↗</a></p></details>`;
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; renderAudit(); });
  };

  root.addEventListener('input', schedule);
  root.addEventListener('change', schedule);
  root.addEventListener('click', event => {
    const starter = event.target.closest('button[data-action="starter"]');
    if (starter && root.dataset.tool === 'session-planner') {
      event.preventDefault();
      event.stopPropagation();
      buildArchitecture();
      setTimeout(schedule, 0);
      return;
    }
    const action = event.target.closest('[data-method-action]')?.dataset.methodAction;
    if (action === 'outcomes') {
      event.preventDefault();
      applyOutcomeTemplate();
    }
    if (action === 'reflection') {
      event.preventDefault();
      applyReflectionTemplate();
    }
    setTimeout(schedule, 0);
  });
  new MutationObserver(schedule).observe(root, {childList:true, subtree:true});
  window.addEventListener('pageshow', schedule);
  schedule();
})();
