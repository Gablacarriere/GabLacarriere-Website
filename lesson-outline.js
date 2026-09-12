(() => {
  'use strict';
  const form = document.getElementById('lessonOutlineForm');
  if (!form) return;
  const result = document.getElementById('outline-result');
  const output = document.getElementById('outline-text');
  const status = document.getElementById('outline-status');
  form.hidden = false;
  form.addEventListener('input', () => { result.hidden = true; status.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const get = key => String(data.get(key) || '').trim();
    if (!get('goal') || !get('activity')) {
      status.textContent = 'Add a learning goal and a practice activity to build your outline.';
      return;
    }
    output.value = [
      'MY LESSON OUTLINE', '',
      'Learners and starting point', get('learners') || 'To clarify: who are my learners, and what can they already do?', '',
      'Learning goal', get('goal'), '',
      'Practice activity', get('activity'), '',
      'Check and transfer', get('check') || 'To clarify: what variation will help me see whether students can use the skill independently?', '',
      'Questions to revisit after teaching',
      'What did I observe? What would I adjust? When will we revisit this skill?', '',
      'Created with the lesson-planning exercise at https://gablacarriere.com/for-teachers/'
    ].join('\n');
    document.getElementById('outline-email').href = 'mailto:hello@gablacarriere.com?subject=' + encodeURIComponent('Pedagogical coaching: my lesson outline') + '&body=' + encodeURIComponent('Hi Gab, I’d like to discuss this lesson outline and how to develop my teaching.\n\n' + output.value);
    result.hidden = false;
    status.textContent = 'Outline prepared. Copy, download or discuss it with Gab.';
    document.getElementById('outline-result-title').focus();
  });
  document.getElementById('outline-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(output.value); status.textContent = 'Outline copied.'; }
    catch { output.focus(); output.select(); status.textContent = 'Select and copy your outline above.'; }
  });
  document.getElementById('outline-download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([output.value], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'my-lesson-outline.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Your text file is ready to download.';
  });
})();
