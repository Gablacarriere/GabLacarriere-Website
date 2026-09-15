(() => {
  'use strict';

  const root = document.getElementById('teachingWorkbench');
  if (!root) return;

  const premiumActions = new Set([
    'conceptDraft',
    'draft',
    'conceptActivities',
    'fillPrerequisites',
    'skillActivities'
  ]);

  const current = () => window.GAB_USER_ACCESS || window.GAB_ACCESS?.fallback?.('teacher_studio') || {
    mode: 'beta',
    tier: 'free',
    full_access: true,
    free_limits: { curricula: 1, sessions: 3 }
  };

  const full = () => window.GAB_ACCESS?.isFull ? window.GAB_ACCESS.isFull(current()) : current().full_access === true;
  const isCourse = () => root.dataset.tool === 'curriculum-planner';

  function upgradeMessage(title, body) {
    let panel = document.getElementById('plannerAccessGate');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'plannerAccessGate';
      panel.className = 'toolPanel premiumGate';
      const toolbar = root.querySelector('.toolToolbar');
      (toolbar || root).insertAdjacentElement(toolbar ? 'afterend' : 'afterbegin', panel);
    }
    panel.innerHTML = `<p class="kicker">FULL STUDIO</p><h2>${title}</h2><p>${body}</p><div class="toolRowActions"><a class="toolLink" href="/for-teachers/#teaching-studio-access">Compare access →</a></div>`;
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function lockGuidance(id, title, teaser) {
    const node = document.getElementById(id);
    if (!node || node.dataset.accessLocked === '1') return;
    node.dataset.accessLocked = '1';
    node.innerHTML = `<div class="premiumPreview"><p class="kicker">FULL STUDIO</p><h3>${title}</h3><p>${teaser}</p><a href="/for-teachers/#teaching-studio-access">See what Full Studio unlocks →</a></div>`;
  }

  function applyLocks() {
    if (full()) return;
    root.querySelectorAll('[data-action]').forEach(button => {
      if (premiumActions.has(button.dataset.action)) button.classList.add('premiumAction');
    });
    lockGuidance(
      'courseCurriculumGuidance',
      'Turn selected concepts into a progression.',
      'Full Studio reveals prerequisite relationships, likely next branches and dependency-aware sequencing.'
    );
    lockGuidance(
      'sessionCurriculumGuidance',
      'See what supports this class and what it can unlock next.',
      'Full Studio connects your selected concept to observation cues, prerequisites, Atlas definitions and next-step recommendations.'
    );
    lockGuidance(
      'skillGuidance',
      'Move from a topic to teachable decisions.',
      'Full Studio adds learning targets, observation cues and role-specific guidance for the practice skills you select.'
    );
  }

  root.addEventListener('click', event => {
    if (full()) return;
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'new') {
      const access = current();
      const select = document.getElementById('planSelect');
      const count = Math.max(0, (select?.options?.length || 1) - 1);
      const key = isCourse() ? 'curricula' : 'sessions';
      const limit = Number(access.free_limits?.[key] || (isCourse() ? 1 : 3));
      if (count < limit) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      upgradeMessage(
        `Your Free Studio includes ${limit} ${isCourse() ? 'curriculum' : 'saved sessions'}.`,
        `Keep using the core planner, or move to Full Studio for unlimited ${isCourse() ? 'curricula' : 'sessions'} and the complete methodology layer.`
      );
      return;
    }

    if (premiumActions.has(action)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      upgradeMessage(
        'This is part of the methodology layer.',
        'Free Studio keeps manual planning usable. Full Studio adds automated sequencing, generated practice structure and deeper teaching guidance.'
      );
    }
  }, true);

  const observer = new MutationObserver(() => applyLocks());
  observer.observe(root, { childList: true, subtree: true });
  window.addEventListener('gab-access-ready', applyLocks);
  applyLocks();
})();
