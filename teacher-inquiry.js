(() => {
  'use strict';
  const form = document.getElementById('teacherInquiryForm');
  if (!form) return;

  const hero = document.querySelector('main .hero');

  if (!document.getElementById('teacher-training-framework-styles')) {
    const style = document.createElement('style');
    style.id = 'teacher-training-framework-styles';
    style.textContent = `
      #teacher-training-framework{padding:72px 0;background:#0d121a;color:#f7f4ee;border-top:1px solid #ffffff12;border-bottom:1px solid #ffffff12}
      #teacher-training-framework .frameworkLead{max-width:800px}
      #teacher-training-framework .frameworkGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:28px}
      #teacher-training-framework .frameworkCard{background:#121923;border:1px solid #ffffff18;border-radius:18px;padding:20px;min-height:230px}
      #teacher-training-framework .frameworkNum{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#7dd8ff;font-weight:900}
      #teacher-training-framework .frameworkCard h3{font-size:1.12rem;margin:10px 0 8px}
      #teacher-training-framework .frameworkCard p{font-size:.93rem;color:#b7bfcb;margin:0}
      #teacher-training-framework .classArc{margin-top:42px;padding:28px;border-radius:22px;background:#efe2cf;color:#15181e}
      #teacher-training-framework .classArc .arcKicker{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#4d6c82;margin:0 0 8px}
      #teacher-training-framework .classArc h3{font-size:1.7rem;margin-bottom:8px}
      #teacher-training-framework .classArcIntro{color:#514c47;max-width:760px;margin:0 0 20px}
      #teacher-training-framework .arcGrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
      #teacher-training-framework .arcStep{background:#fff9ef;border:1px solid #15181e1c;border-radius:14px;padding:14px}
      #teacher-training-framework .arcStep strong{display:block;font-size:.91rem;line-height:1.2;margin-bottom:6px}
      #teacher-training-framework .arcStep span{display:block;font-size:.8rem;line-height:1.4;color:#665f58}
      #teacher-training-framework .frameworkNotes{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}
      #teacher-training-framework .frameworkNote{padding:18px 20px;border:1px solid #ffffff18;border-radius:16px;background:#10161f;color:#b9c1cd}
      #teacher-training-framework .frameworkNote strong{color:#fff}
      #teacher-training-framework .frameworkNote p{margin:6px 0 0}
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
      @media(max-width:1050px){#teacher-training-framework .frameworkGrid{grid-template-columns:repeat(2,1fr)}#teacher-training-framework .arcGrid{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:820px){#teacher-training-framework{padding:54px 0}#teacher-training-framework .frameworkGrid,#teacher-training-framework .frameworkNotes{grid-template-columns:1fr}#teacher-training-framework .arcGrid{grid-template-columns:1fr 1fr}#teaching-audit-offer{padding:42px 0}#teaching-audit-offer .auditWrap{grid-template-columns:1fr;gap:22px}}
      @media(max-width:520px){#teacher-training-framework .arcGrid{grid-template-columns:1fr}#teacher-training-framework .classArc{padding:20px}}
    `;
    document.head.appendChild(style);
  }

  const teacherSupport = document.getElementById('teacher-support');
  if (teacherSupport && !document.getElementById('teacher-training-framework')) {
    const framework = document.createElement('section');
    framework.id = 'teacher-training-framework';
    framework.setAttribute('aria-labelledby', 'teacher-framework-title');
    framework.innerHTML = `
      <div class="w">
        <p class="kicker">Teacher framework · From the 100-hour training</p>
        <h2 id="teacher-framework-title">Teaching is a sequence of decisions.</h2>
        <p class="lede frameworkLead">A good class is not a list of movements to cover. It connects clear outcomes, prerequisites, attention, practice, feedback and reflection—then changes when the students show you something different.</p>

        <div class="frameworkGrid">
          <article class="frameworkCard">
            <span class="frameworkNum">01 · Outcomes</span>
            <h3>Define the learning first.</h3>
            <p>Start with what students should be able to do, not simply what you plan to teach. I separate technical, social and personal outcomes so the class develops more than movement vocabulary.</p>
          </article>
          <article class="frameworkCard">
            <span class="frameworkNum">02 · Layering</span>
            <h3>Reduce complexity without losing the idea.</h3>
            <p>Break movement into larger components and smaller mechanical elements. Build basic, intermediate and advanced versions so challenge can change without changing the learning goal.</p>
          </article>
          <article class="frameworkCard">
            <span class="frameworkNum">03 · Attention</span>
            <h3>Give the brain a manageable task.</h3>
            <p>Use precise instructions and one useful focus at a time. Demonstrate, count, describe, use imagery and let students feel the task—multiple routes into the same idea without overloading attention.</p>
          </article>
          <article class="frameworkCard">
            <span class="frameworkNum">04 · Feedback</span>
            <h3>Close the loop.</h3>
            <p>Observe something specific, give one concrete next action, then return and check what changed. Feedback is not finished when the teacher speaks; it is finished when we can observe the next attempt.</p>
          </article>
          <article class="frameworkCard">
            <span class="frameworkNum">05 · Reflection</span>
            <h3>Evaluate the teaching, not only the student.</h3>
            <p>If the intended learning does not appear, reconsider the cue, exercise, progression or environment. Student outcomes are evidence about our teaching decisions and what should change next.</p>
          </article>
        </div>

        <div class="classArc">
          <p class="arcKicker">Class architecture</p>
          <h3>Prepare → learn → integrate → recover.</h3>
          <p class="classArcIntro">The exact timing changes by class, but the functions should be intentional. Warm-up is split into general readiness and specific preparation for the actual demands of the lesson.</p>
          <div class="arcGrid">
            <div class="arcStep"><strong>Mental arrival</strong><span>Focus attention, establish context and make the learning goal clear.</span></div>
            <div class="arcStep"><strong>General warm-up</strong><span>Raise whole-body readiness and progressively move the major regions of the body.</span></div>
            <div class="arcStep"><strong>Specific warm-up</strong><span>Prepare the exact ranges, tissues, coordination, rhythm or connection demands used later.</span></div>
            <div class="arcStep"><strong>Main learning</strong><span>Build the focal skill through clear layers, high-quality attempts and useful feedback.</span></div>
            <div class="arcStep"><strong>Integration & transfer</strong><span>Change partner, music, constraints or context so the skill becomes adaptable rather than memorized.</span></div>
            <div class="arcStep"><strong>Cool-down & reflection</strong><span>Reduce intensity, notice what changed and connect today’s learning to what comes next.</span></div>
          </div>
        </div>

        <div class="frameworkNotes">
          <div class="frameworkNote"><strong>Evidence note.</strong><p>I use multimodal instruction rather than assigning students fixed “visual”, “auditory” or “kinesthetic” learning styles. The useful question is which representation helps this learner understand this task—not which permanent category they belong to.</p></div>
          <div class="frameworkNote"><strong>Built through practice.</strong><p>Part of this framework grew out of the 100-hour teacher training I co-developed with Caroline Haugsted: theory, observation, assisted teaching, live practice, peer feedback, self-evaluation, ethics and community leadership.</p></div>
        </div>
      </div>`;
    teacherSupport.insertAdjacentElement('afterend', framework);
  }

  if (hero && !document.getElementById('teaching-audit-offer')) {
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