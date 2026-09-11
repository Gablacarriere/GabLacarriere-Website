(() => {
  const form = document.getElementById('event-form');
  if (!form) return;
  const draft = document.getElementById('event-draft');
  const message = document.getElementById('event-message');
  const status = document.getElementById('event-status');
  form.hidden = false;
  form.addEventListener('input', () => { draft.hidden = true; status.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const get = name => String(data.get(name) || '').trim();
    message.value = [
      'Hi Gab,', '', "I'd like to discuss a workshop or event with you.", '',
      'Organizer: ' + get('organizer'), 'City / country: ' + get('city'),
      'Dates / timeframe: ' + get('dates'), 'Format: ' + get('format'),
      'Dance focus: ' + get('dance'), 'Dancer level: ' + (get('level') || 'To discuss'),
      '', get('details'), '', 'Could we discuss availability, the teaching plan and fees?', '', 'Thank you!'
    ].filter((line, i, all) => line || all[i - 1]).join('\n');
    document.getElementById('event-email').href = 'mailto:riseadance@gmail.com?subject=' + encodeURIComponent('Workshop inquiry — ' + get('city')) + '&body=' + encodeURIComponent(message.value);
    document.getElementById('event-whatsapp').href = 'https://wa.me/19295864994?text=' + encodeURIComponent(message.value);
    status.textContent = 'Message prepared. It has not been sent.';
    draft.hidden = false;
    document.getElementById('event-draft-title').focus();
  });
  document.getElementById('event-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(message.value); status.textContent = 'Copied. Paste it into your message to Gab.'; }
    catch { message.focus(); message.select(); status.textContent = 'Select and copy the message above, then paste it into your email or WhatsApp.'; }
  });
})();
