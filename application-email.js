(() => {
  const form = document.getElementById('f');
  if (!form) return;
  const prepare = document.getElementById('prepare-application');
  const draft = document.getElementById('application-draft');
  const text = document.getElementById('application-text');
  const open = document.getElementById('open-application-email');
  const whatsapp = document.getElementById('open-application-whatsapp');
  const status = document.getElementById('application-status');
  const actions = draft?.querySelector('.actions');
  prepare.hidden = false;

  // A simple honeypot for automated form fillers. It is intentionally invisible to people.
  const trap = document.createElement('input');
  trap.type = 'text';
  trap.name = 'website';
  trap.autocomplete = 'off';
  trap.tabIndex = -1;
  trap.setAttribute('aria-hidden', 'true');
  trap.style.position = 'absolute';
  trap.style.left = '-9999px';
  trap.style.width = '1px';
  trap.style.height = '1px';
  trap.style.opacity = '0';
  form.appendChild(trap);

  const send = document.createElement('button');
  send.type = 'button';
  send.className = 'btn';
  send.id = 'send-application-direct';
  send.textContent = 'Send application to Gab';
  send.hidden = true;
  if (actions) actions.prepend(send);

  const formPayload = () => {
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
  };

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
    if (!value('name') || !value('goal')) {
      status.textContent = 'Please add your name and a short description of your goal.';
      draft.hidden = false;
      send.hidden = true;
      open.removeAttribute('href');
      if (whatsapp) whatsapp.removeAttribute('href');
      text.value = '';
      return;
    }
    const body = lines.join('\n\n');
    text.value = 'Subject: ' + subject + '\n\n' + body;
    open.href = 'mailto:hello@gablacarriere.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    if (whatsapp) whatsapp.href = 'https://wa.me/19295864994?text=' + encodeURIComponent('Hi Gab, I’d like to discuss joining the mentorship.\n\n' + body);
    send.hidden = false;
    send.disabled = false;
    send.textContent = 'Send application to Gab';
    status.textContent = 'Review your answers, then send directly here. WhatsApp and email are available as backups.';
    draft.hidden = false;
    document.getElementById('draft-heading').focus();
  });

  form.addEventListener('input', (event) => {
    if (!event.target.name || event.target === trap || draft.hidden) return;
    draft.hidden = true;
    send.hidden = true;
    open.removeAttribute('href');
    if (whatsapp) whatsapp.removeAttribute('href');
    status.textContent = '';
    text.value = '';
  });

  send.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    send.disabled = true;
    send.textContent = 'Sending…';
    status.textContent = 'Sending your application to Gab…';

    try {
      const response = await fetch('/api/mentorship-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload())
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Delivery failed');

      send.textContent = 'Application sent ✓';
      status.textContent = 'Application sent to Gab. You can expect a personal follow-up about fit and next steps.';
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'mentorship_application_sent', { method: 'website' });
      }
    } catch (error) {
      send.disabled = false;
      send.textContent = 'Try sending again';
      status.textContent = 'The website could not deliver your application. Please use WhatsApp or email below instead.';
    }
  });

  document.getElementById('copy-application').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text.value);
      status.textContent = 'Copied. Paste this into WhatsApp with Gab or email hello@gablacarriere.com, then send it.';
    } catch {
      text.focus();
      text.select();
      status.textContent = 'Select and copy the application text, then paste it into WhatsApp or your email. Nothing has been sent.';
    }
  });
})();
