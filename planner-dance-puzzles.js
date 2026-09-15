(() => {
  'use strict';
  if (document.getElementById('teachingWorkbench')?.dataset.tool !== 'session-planner') return;

  const root = document.getElementById('teachingWorkbench');
  const status = document.getElementById('toolStatus');
  let scheduled = false;

  const lib = () => window.GAB_DANCE_PUZZLES;
  const curriculum = () => window.GAB_CURRICULUM;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const skillName = id => curriculum()?.displayName?.(id) || id;
  const minutesFor = duration => {
    const nums = String(duration || '').match(/\d+/g)?.map(Number) || [];
    if (!nums.length) return 5;
    if (nums.length === 1) return nums[0];
    return Math.max(1, Math.round((nums[0] + nums[1]) / 2));
  };
  const puzzleConcepts = puzzle => [...new Set([
    puzzle.primarySkill,
    ...(puzzle.secondarySkills || []),
    ...(puzzle.atlasLinks || [])
  ].filter(Boolean))];
  const instructionText = puzzle => [
    `${puzzle.id} · ${puzzle.type}`,
    `Target cognitive skill: ${skillName(puzzle.primarySkill)}`,
    puzzle.secondarySkills?.length ? `Secondary cognitive skills: ${puzzle.secondarySkills.map(skillName).join(', ')}` : '',
    `Setup: ${puzzle.setup}`,
    `Puzzle: ${puzzle.prompt}`,
    `Constraint: ${puzzle.constraint}`,
    `Expected reasoning: ${puzzle.reasoning}`,
    `Physical test: ${puzzle.test}`,
    `Reflection: ${puzzle.reflection}`,
    `Role: ${(puzzle.roles || []).join(' + ')} · Style: ${puzzle.style}`
  ].filter(Boolean).join('\n\n');

  function selectedPuzzle() {
    const select = document.getElementById('dancePuzzlePicker');
    return lib()?.puzzles?.find(p => p.id === select?.value) || null;
  }

  function filterPuzzles() {
    const library = lib();
    if (!library) return [];
    const skill = document.getElementById('dancePuzzleSkill')?.value || '';
    const level = document.getElementById('dancePuzzleLevel')?.value || '';
    const role = document.getElementById('dancePuzzleRole')?.value || '';
    return library.puzzles.filter(p => {
      const skills = [p.primarySkill, ...(p.secondarySkills || [])];
      const roles = p.roles?.includes('both') ? ['both','leader','follower'] : (p.roles || []);
      return (!skill || skills.includes(skill)) && (!level || String(p.level) === level) && (!role || roles.includes(role));
    });
  }

  function updatePicker() {
    const picker = document.getElementById('dancePuzzlePicker');
    if (!picker) return;
    const previous = picker.value;
    const rows = filterPuzzles();
    picker.innerHTML = rows.map(p => `<option value="${esc(p.id)}">${esc(p.id)} · ${esc(p.title)}</option>`).join('');
    const requested = new URLSearchParams(location.search).get('puzzle');
    if (rows.some(p => p.id === previous)) picker.value = previous;
    else if (requested && rows.some(p => p.id === requested)) picker.value = requested;
    updatePreview();
  }

  function updatePreview() {
    const puzzle = selectedPuzzle();
    const preview = document.getElementById('dancePuzzlePreview');
    if (!preview) return;
    if (!puzzle) {
      preview.innerHTML = '<p class="toolHint">No puzzle matches these filters.</p>';
      return;
    }
    preview.innerHTML = `<article class="skillGuide"><p class="kicker">${esc(puzzle.id)} · LEVEL ${puzzle.level}</p><h3>${esc(puzzle.title)}</h3><p><strong>Primary skill:</strong> ${esc(skillName(puzzle.primarySkill))}</p><p><strong>Puzzle:</strong> ${esc(puzzle.prompt)}</p><p><strong>Constraint:</strong> ${esc(puzzle.constraint)}</p><p class="toolHint">Suggested class time: ${minutesFor(puzzle.duration)} minutes · ${esc(puzzle.roles.join(' + '))} · ${esc(puzzle.style)}</p></article>`;
  }

  function injectPanel() {
    const library = lib();
    if (!library || document.getElementById('dancePuzzlePlannerPanel')) return;
    const activities = [...root.querySelectorAll('.toolPanel')].find(panel => panel.querySelector('h2')?.textContent.trim() === 'Activities & timing');
    if (!activities) return;

    const requested = new URLSearchParams(location.search).get('puzzle');
    const skillOptions = Object.values(library.skills).map(id => `<option value="${esc(id)}">${esc(skillName(id))}</option>`).join('');
    const panel = document.createElement('section');
    panel.className = 'toolPanel';
    panel.id = 'dancePuzzlePlannerPanel';
    panel.innerHTML = `<p class="kicker">PERCEPTION &amp; PROJECTION</p><h2>Add a Dance Puzzle</h2><p class="toolHint">Choose a short cognitive problem. Adding it creates a timed activity and also selects the puzzle's cognitive and movement concepts in this session.</p><div class="toolFields"><label>Cognitive skill<select id="dancePuzzleSkill"><option value="">All skills</option>${skillOptions}</select></label><label>Difficulty<select id="dancePuzzleLevel"><option value="">All levels</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option></select></label><label>Role<select id="dancePuzzleRole"><option value="">All roles</option><option value="leader">Leader</option><option value="follower">Follower</option><option value="both">Both</option></select></label><label class="wide">Puzzle<select id="dancePuzzlePicker"></select></label></div><div id="dancePuzzlePreview"></div><div class="toolRowActions"><button class="toolPrimary" type="button" id="addDancePuzzle">Add puzzle to this session</button><a class="toolLink" href="/dance-puzzles/" target="_blank" rel="noopener">Browse all 30 puzzles ↗</a></div>`;
    activities.before(panel);

    ['dancePuzzleSkill','dancePuzzleLevel','dancePuzzleRole'].forEach(id => document.getElementById(id)?.addEventListener('change', updatePicker));
    document.getElementById('dancePuzzlePicker')?.addEventListener('change', updatePreview);
    document.getElementById('addDancePuzzle')?.addEventListener('click', addPuzzle);
    updatePicker();
    if (requested && library.puzzles.some(p => p.id === requested)) {
      const picker = document.getElementById('dancePuzzlePicker');
      if (picker && [...picker.options].some(o => o.value === requested)) {
        picker.value = requested;
        updatePreview();
        panel.scrollIntoView({block:'center'});
      }
    }
  }

  function dispatch(el, type) {
    el.dispatchEvent(new Event(type, {bubbles:true}));
  }

  function selectConcepts(puzzle) {
    const wanted = puzzleConcepts(puzzle);
    let added = 0;
    for (const conceptId of wanted) {
      const checkbox = root.querySelector(`[data-concept="${CSS.escape(conceptId)}"][data-concept-set="conceptIds"]`);
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        dispatch(checkbox, 'change');
        added++;
      }
    }
    return added;
  }

  function addPuzzle() {
    const puzzle = selectedPuzzle();
    if (!puzzle) return;
    const add = root.querySelector('[data-action="addActivity"]');
    if (!add) {
      if (status) status.textContent = 'Open or create a session before adding a Dance Puzzle.';
      return;
    }
    add.click();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const rows = [...root.querySelectorAll('.toolRow')];
      const row = rows[rows.length - 1];
      if (!row) return;
      const title = row.querySelector('input[data-field="title"]');
      const mins = row.querySelector('input[data-field="minutes"]');
      const instructions = row.querySelector('textarea[data-field="instructions"]');
      if (!title || !mins || !instructions) return;

      title.value = `Dance Puzzle · ${puzzle.title}`;
      mins.value = String(minutesFor(puzzle.duration));
      instructions.value = instructionText(puzzle);
      dispatch(title, 'input');
      dispatch(mins, 'input');
      dispatch(instructions, 'input');
      const concepts = selectConcepts(puzzle);
      if (status) status.textContent = `${puzzle.id} added as a ${mins.value}-minute activity${concepts ? ` · ${concepts} curriculum concept${concepts === 1 ? '' : 's'} linked` : ''}.`;
    }));
  }

  function scheduleInject() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      injectPanel();
    });
  }

  new MutationObserver(scheduleInject).observe(root, {childList:true, subtree:true});
  window.addEventListener('load', scheduleInject);
  scheduleInject();
})();