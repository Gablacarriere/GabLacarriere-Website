(() => {
  'use strict';
  const root = document.getElementById('teachingWorkbench');
  const METHOD = window.GAB_METHODOLOGY;
  if (!root || !METHOD) return;

  const CURR = window.GAB_CURRICULUM;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val = key => root.querySelector(`[data-field="${key}"]`)?.value?.trim() || '';
  const checkedConcepts = () => [...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(el => el.dataset.concept);

  function item(label, ok, prompt) {
    return `<li class="methodologyCheck ${ok ? 'methodologyOk' : 'methodologyPrompt'}"><span aria-hidden="true">${ok ? '✓' : '○'}</span><div><strong>${esc(label)}</strong>${prompt ? `<small>${esc(prompt)}</small>` : ''}</div></li>`;
  }

  function selectedAdvancedConcept() {
    if (!CURR?.concept) return false;
    return checkedConcepts().some(id => METHOD.safety.advancedFamilies.includes(CURR.concept(id)?.family));
  }

  function sessionAudit() {
    const activities = [...root.querySelectorAll('[data-activity][data-field="title"]')].map(title => {
      const id = title.dataset.activity;
      const instructions = root.querySelector(`[data-activity="${CSS.escape(id)}"][data-field="instructions"]`)?.value || '';
      return {title:title.value || '', instructions};
    });
    const roles = new Set(activities.flatMap(a => METHOD.activityRole(a.title, a.instructions)));
    const goal = !!val('goal');
    const assessment = !!val('assessment');
    const adaptations = !!val('adaptations');
    const readiness = !!val('readiness');
    const advanced = selectedAdvancedConcept();

    const checks = [
      ['Clear learning target', goal, 'Name what learners should understand or be able to do, not only the pattern being taught.'],
      ['General warm-up', roles.has('general-warmup'), METHOD.warmup.general],
      ['Specific warm-up', roles.has('specific-warmup'), METHOD.warmup.specific],
      ['Understand / model', roles.has('understand') || goal, 'Give learners a simple model or observable question for the target mechanism.'],
      ['Feel / discriminate', roles.has('feel'), 'Include a task that helps learners notice a relevant sensation, contrast, timing, weight, tone or connection quality.'],
      ['Focused practice', roles.has('practice'), 'Protect enough repetitions around one primary variable or question.'],
      ['Variation & transfer', roles.has('adapt'), 'Change one meaningful condition and test whether the skill survives.'],
      ['Retrieval & reflection', roles.has('retrieve') || !!val('reflection'), 'Ask learners to reconstruct or self-assess before supplying the answer again.'],
      ['Adaptations & alternatives', adaptations, 'Plan a regression, challenge, alternative or neutral option for different needs.'],
      ['Evidence of learning', assessment, 'Define what you will observe to distinguish learning from temporary imitation.'],
      ['Cool-down / recovery', roles.has('cooldown'), METHOD.sessionArchitecture.find(x => x.id === 'cooldown')?.purpose || 'Close the physical session deliberately.']
    ];
    if (advanced) checks.push(['Readiness / consent for advanced material', readiness, 'For head movement or off-axis work, record observed readiness, consent and an on-axis or neutral alternative.']);

    return checks;
  }

  function courseAudit() {
    const sessionLinks = new Set([...root.querySelectorAll('a[href*="/session-planner/?session="]')].map(a => a.href));
    const stageText = [...root.querySelectorAll('.toolRowTop span')].map(el => el.textContent.toLowerCase()).join(' ');
    const targets = checkedConcepts().length;
    const checks = [
      ['End-state learning goals', !!val('goals'), 'Describe what learners should be able to perceive, organize or do by the end of the curriculum.'],
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
  root.addEventListener('click', () => setTimeout(schedule, 0));
  new MutationObserver(schedule).observe(root, {childList:true, subtree:true});
  window.addEventListener('pageshow', schedule);
  schedule();
})();
