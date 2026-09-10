(() => {
  const form = document.getElementById('f');
  if (!form) return;
  const prepare = document.getElementById('prepare-application');
  const draft = document.getElementById('application-draft');
  const text = document.getElementById('application-text');
  const open = document.getElementById('open-application-email');
  const status = document.getElementById('application-status');
  prepare.hidden = false;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = (key) => String(data.get(key) || '').trim();
    const subject = 'Mentorship application — ' + value('name');
    const lines = [
      'Name: ' + value('name'),
      'Email: ' + value('email'),
      'Partner-dance experience: ' + value('experience'),
      'Dance focus: ' + value('focus'),
      'Main goal: ' + value('goal'),
    ];
    if (value('challenge')) lines.push('Current challenge: ' + value('challenge'));
    if (value('why')) lines.push('Interest in mentorship: ' + value('why'));
    const body = lines.join('\n\n');
    text.value = 'Subject: ' + subject + '\n\n' + body;
    open.href = 'mailto:riseadance@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    status.textContent = 'Prepared on this page. Your application has not been sent.';
    draft.hidden = false;
    document.getElementById('draft-heading').focus();
  });

  form.addEventListener('input', (event) => {
    if (!event.target.name || draft.hidden) return;
    draft.hidden = true;
    open.removeAttribute('href');
    status.textContent = '';
    text.value = '';
  });

  document.getElementById('copy-application').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text.value);
      status.textContent = 'Copied. Paste this into an email to riseadance@gmail.com, then send it.';
    } catch {
      text.focus();
      text.select();
      status.textContent = 'Select and copy the application text, then paste it into your email. Nothing has been sent.';
    }
  });
})();
