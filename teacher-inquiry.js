(() => {
  'use strict';
  const form = document.getElementById('teacherInquiryForm');
  if (!form) return;
  const draft = document.getElementById('inquiry-draft');
  const message = document.getElementById('teacher-message');
  const status = document.getElementById('inquiry-status');
  form.hidden = false;
  form.addEventListener('input', () => { draft.hidden = true; status.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const get = name => String(data.get(name) || '').trim();
    if (!get('name') || !get('context') || !get('goal')) {
      status.textContent = 'Please add your name, teaching experience and the support you need.';
      return;
    }
    message.value = [
      'Hi Gab, I’m ' + get('name') + '.', '',
      'I’d like to discuss: ' + get('interest') + '.', '',
      'My teaching and experience:', get('context'), '',
      'My learners: ' + (get('learners') || 'To discuss'), '',
      'What I’d like to improve or build:', get('goal'), '',
      'Location and timing: ' + (get('timing') || 'To discuss'), '',
      'Could we discuss a suitable format, availability and fee?'
    ].join('\n');
    document.getElementById('teacher-whatsapp').href = 'https://wa.me/19295864994?text=' + encodeURIComponent(message.value);
    document.getElementById('teacher-email').href = 'mailto:hello@gablacarriere.com?subject=' + encodeURIComponent(get('interest') + ' inquiry') + '&body=' + encodeURIComponent(message.value);
    draft.hidden = false;
    status.textContent = 'Your message is prepared. Choose how to send it below.';
    document.getElementById('inquiry-draft-title').focus();
  });
  document.getElementById('teacher-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message.value);
      status.textContent = 'Message copied. Paste it into your conversation with Gab.';
    } catch {
      message.focus(); message.select();
      status.textContent = 'Select and copy the message above.';
    }
  });
})();
