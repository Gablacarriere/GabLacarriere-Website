(() => {
  'use strict';
  const form = document.getElementById('teacherInquiryForm');
  if (!form) return;

  const hero = document.querySelector('main .hero');
  if (hero && !document.getElementById('teaching-audit-offer')) {
    const style = document.createElement('style');
    style.textContent = `
      #teaching-audit-offer{padding:56px 0;background:#efe2cf;color:#15181e}
      #teaching-audit-offer .auditWrap{display:grid;grid-template-columns:1.15fr .85fr;gap:34px;align-items:start}
      #teaching-audit-offer .auditKicker{font-size:.76rem;text-transform:uppercase;letter-spacing:.11em;font-weight:900;color:#3b6080;margin:0 0 12px}
      #teaching-audit-offer h2{color:#15181e;margin-bottom:14px}
      #teaching-audit-offer .auditLead{font-size:1.15rem;line-height:1.55;max-width:720px;color:#4d4944}
      #teaching-audit-offer .auditCard{background:#fff8ee;border:1px solid #15181e22;border-radius:22px;padding:24px}
      #teaching-audit-offer .auditPrice{font-size:2.2rem;font-weight:900;letter-spacing:-.04em;margin:0 0 4px}
      #teaching-audit-offer .auditCard ul{padding-left:20px;margin:16px 0 20px}
      #teaching-audit-offer .auditCard li{margin:8px 0}
      #teaching-audit-offer .auditBtn{display:inline-flex;align-items:center;justify-content:center;padding:11px 16px;border-radius:999px;background:#15181e;color:#fff;font-weight:850;text-decoration:none}
      #teaching-audit-offer .auditNote{font-size:.86rem;color:#6a635c;margin-top:12px}
      @media(max-width:820px){#teaching-audit-offer{padding:42px 0}#teaching-audit-offer .auditWrap{grid-template-columns:1fr;gap:22px}}
    `;
    document.head.appendChild(style);

    const section = document.createElement('section');
    section.id = 'teaching-audit-offer';
    section.innerHTML = `
      <div class="w auditWrap">
        <div>
          <p class="auditKicker">Pilot offer · Teacher coaching</p>
          <h2>Teaching Audit</h2>
          <p class="auditLead">Bring one real class—not an abstract teaching problem. I’ll examine where learning is getting stuck, what your exercises are actually training, and how to make the class clearer, more practice-dense and easier to adapt.</p>
          <p>This is designed for dance teachers who want a concrete outside analysis of a class they already teach, rather than a long coaching commitment.</p>
        </div>
        <div class="auditCard">
          <div class="auditPrice">$175</div>
          <strong>One focused teaching review</strong>
          <ul>
            <li>Send a lesson plan and/or up to 20 minutes of teaching video.</li>
            <li>I review the learning goal, sequencing, explanations, exercises, feedback and practice density.</li>
            <li>60-minute private coaching session.</li>
            <li>A revised class structure plus 3–5 concrete priorities to test next.</li>
          </ul>
          <a class="auditBtn" href="?support=audit#teacher-contact" data-teaching-audit-cta>Request a Teaching Audit</a>
          <p class="auditNote">Pilot pricing. Sending an inquiry does not confirm a booking.</p>
        </div>
      </div>`;
    hero.insertAdjacentElement('afterend', section);
    section.querySelector('[data-teaching-audit-cta]')?.addEventListener('click', () => {
      if (typeof window.gtag === 'function') window.gtag('event', 'teaching_audit_interest');
    });
  }

  const draft = document.getElementById('inquiry-draft');
  const message = document.getElementById('teacher-message');
  const status = document.getElementById('inquiry-status');
  const interestSelect = document.getElementById('teacher-interest');
  if (interestSelect && ![...interestSelect.options].some(o => o.value === 'Teaching Audit')) {
    const option = document.createElement('option');
    option.value = 'Teaching Audit';
    option.textContent = 'Teaching Audit — $175 pilot';
    interestSelect.insertBefore(option, interestSelect.firstChild);
  }

  const interests = {
    audit: 'Teaching Audit',
    development: 'Teacher development',
    curriculum: 'Curriculum design or review',
    coaching: 'Pedagogical coaching',
    team: 'Training for a teaching team'
  };
  const requested = new URLSearchParams(location.search).get('support');
  if (Object.hasOwn(interests, requested)) {
    interestSelect.value = interests[requested];
  }
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
    const isAudit = get('interest') === 'Teaching Audit';
    message.value = [
      'Hi Gab, I’m ' + get('name') + '.', '',
      'I’d like to discuss: ' + get('interest') + (isAudit ? ' ($175 pilot).' : '.'), '',
      'My teaching and experience:', get('context'), '',
      'My learners: ' + (get('learners') || 'To discuss'), '',
      'What I’d like to improve or build:', get('goal'), '',
      'Location and timing: ' + (get('timing') || 'To discuss'), '',
      isAudit ? 'I can share a lesson plan and/or teaching video for the audit.' : 'Could we discuss a suitable format, availability and fee?'
    ].join('\n');
    document.getElementById('teacher-whatsapp').href = 'https://wa.me/19295864994?text=' + encodeURIComponent(message.value);
    document.getElementById('teacher-email').href = 'mailto:hello@gablacarriere.com?subject=' + encodeURIComponent(get('interest') + ' inquiry') + '&body=' + encodeURIComponent(message.value);
    draft.hidden = false;
    status.textContent = 'Your message is prepared. Choose how to send it below.';
    document.getElementById('inquiry-draft-title').focus();
    if (typeof window.gtag === 'function') window.gtag('event', isAudit ? 'teaching_audit_inquiry_prepared' : 'teacher_inquiry_prepared', {interest:get('interest')});
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