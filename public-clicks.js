// Public-site interaction helpers + privacy-safe click counts.
(() => {
  const publicPages = new Set(['index','about','learn','method','movement-architecture','kinesthetic-practice','how-to-practice-zouk','classes','brazilian-zouk-classes-nyc','lambada-classes-nyc','zouk-nyc-guide','privates','mentorship','work-with-gab','workshops','experience','wedding','creative','zouk-bnb','journal','feedback','reviews','alex-de-carvalho','for-teachers']);
  const source = document.body.dataset.page;
  if (!publicPages.has(source)) return;

  const findSectionContaining = text => {
    for (const section of document.querySelectorAll('main section')) {
      if ((section.textContent || '').includes(text)) return section;
    }
    return null;
  };
  const removeSectionContaining = text => findSectionContaining(text)?.remove();

  // Keep the main Classes page decision-focused. Detailed teaching content still lives on its own pages.
  if (source === 'classes') {
    document.querySelector('.hero .breadcrumb')?.remove();
    document.querySelector('.classGuidance')?.remove();
    document.querySelectorAll('.classFlyer,.workshopWide').forEach(node => node.remove());

    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) heroTitle.textContent = 'Two weekly class nights in NYC.';
    const heroLede = document.querySelector('.hero .lede');
    if (heroLede) heroLede.textContent = 'Tuesday Brazilian Zouk for intermediate+ dancers. Thursday Lambada for dancers building foundations and structure. Choose your night below.';
    const classIntro = document.querySelector('#schedule .classIntro');
    if (classIntro) classIntro.textContent = 'Choose a class night below. Message Gab to confirm the current studio room and how to join.';

    // The membership section is directly below the class cards, so a separate jump button duplicates the reading flow.
    document.querySelector('#schedule a[href="#tuesday-memberships"]')?.remove();

    // Show prices first, then one enrollment action instead of four competing buttons.
    const membershipSection = document.querySelector('#tuesday-memberships');
    if (membershipSection) {
      membershipSection.querySelectorAll('.membershipOption .btn').forEach(link => link.remove());
      if (!membershipSection.querySelector('.membershipJoin')) {
        const actions = document.createElement('div');
        actions.className = 'actions membershipJoin';
        actions.innerHTML = '<a class="btn" href="https://wa.me/19295864994?text=Hi%20Gab%2C%20I%E2%80%99m%20interested%20in%20a%20Tuesday%20Zouk%20membership.%20Could%20you%20help%20me%20choose%20the%20right%20plan%20and%20confirm%20the%20next%20start%20date%2C%20studio%20room%20and%20enrollment%20details%3F" target="_blank" rel="noopener">Ask about Tuesday membership</a>';
        const notes = membershipSection.querySelector('.pricingNote');
        if (notes) notes.before(actions); else membershipSection.querySelector('.w')?.append(actions);
      }
    }

    removeSectionContaining('What you train');
    removeSectionContaining('Learn between classes');
    removeSectionContaining('Visiting New York?');
    document.querySelectorAll('#student-questions details[open]').forEach(item => item.removeAttribute('open'));
  }

  // Private Training should be a two-choice page: diagnose/refine or repeat/integrate.
  if (source === 'privates') {
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) heroTitle.textContent = 'Private training for Zouk & Lambada.';
    const heroLede = document.querySelector('.hero .lede');
    if (heroLede) heroLede.textContent = 'Choose a 1-hour private when you want to understand and refine a specific problem. Choose a 30-minute Kinesthetic Practice session when you know what to work on and need focused repetition.';

    const heroActions = document.querySelectorAll('.hero .actions a');
    if (heroActions[0]) heroActions[0].textContent = 'Compare the two formats';
    if (heroActions[1]) heroActions[1].textContent = 'Not sure? Ask Gab';

    const formatCards = document.querySelectorAll('#formats .formatCard');
    if (formatCards[1]) {
      const title = formatCards[1].querySelector('h3');
      if (title) title.textContent = 'Kinesthetic Practice';
      const body = formatCards[1].querySelectorAll('p');
      if (body[2]) body[2].textContent = 'Spend 30 minutes moving, repeating and adjusting with immediate partner feedback so the skill becomes easier to reproduce in real dancing.';
    }

    removeSectionContaining('Arrange your session');
    removeSectionContaining('Keep developing');
    removeSectionContaining('Explore the learning system');
    document.querySelectorAll('#student-questions details[open]').forEach(item => item.removeAttribute('open'));

    const inquiryTitle = document.querySelector('#training-inquiry h2');
    if (inquiryTitle) inquiryTitle.textContent = 'Ready to train?';
  }

  // Mentorship is a fit/application page, not a tour of every tool inside the member ecosystem.
  if (source === 'mentorship') {
    document.querySelector('.hero .breadcrumb')?.remove();

    const heroActions = document.querySelectorAll('.hero .actions a');
    if (heroActions[0]) heroActions[0].textContent = 'Apply for mentorship';
    if (heroActions[1]) heroActions[1].textContent = 'See what is included';

    // The public decision should not branch into the internal product universe.
    document.querySelector('#referral-reward')?.remove();
    document.querySelector('#your-learning-worlds')?.remove();
    removeSectionContaining('The learning loop');
    removeSectionContaining('Teaching approach');
    removeSectionContaining('Explore the approach');
    removeSectionContaining('Current members');
    removeSectionContaining('You do not need to know exactly what is wrong with your dancing.');

    // Put audience fit before the offer details, where it helps the decision.
    const who = findSectionContaining('Who it is for');
    const why = document.querySelector('#why-mentorship');
    if (who && why) why.after(who);

    // One concise member-space mention is enough; prospects do not need the full dashboard preview here.
    const membership = document.querySelector('#membership');
    membership?.querySelector('.portalPreview')?.remove();
    const membershipGrid = membership?.querySelector('.w.g2');
    if (membershipGrid) membershipGrid.style.gridTemplateColumns = '1fr';
    membership?.querySelectorAll('a[href="#your-learning-worlds"]').forEach(link => link.remove());

    // Keep the practical monthly rules, but make them secondary to the actual offer.
    const rulesHeading = [...(membership?.querySelectorAll('h3') || [])].find(h => h.textContent.includes('How the monthly membership works'));
    const rulesCard = rulesHeading?.closest('.card');
    if (rulesCard) {
      const details = document.createElement('details');
      details.className = 'applicationExtra mentorshipRules';
      const summary = document.createElement('summary');
      summary.textContent = 'Monthly membership details';
      details.append(summary, ...[...rulesCard.children].filter(child => child !== rulesHeading));
      rulesCard.replaceWith(details);
    }

    // The FAQ can explain tools without sending prospects into the member interface.
    const toolQuestion = [...document.querySelectorAll('#student-questions details')].find(item => (item.querySelector('summary')?.textContent || '').includes('Zoukable and Atlas'));
    const toolAnswer = toolQuestion?.querySelector('p');
    if (toolAnswer) toolAnswer.textContent = 'Zoukable supports rhythm and practice between sessions. Atlas keeps coach-reviewed discoveries, session notes and practice priorities connected to your longer-term learning.';
    document.querySelectorAll('#student-questions details[open]').forEach(item => item.removeAttribute('open'));

    const applicationTitle = document.querySelector('#apply h2');
    if (applicationTitle) applicationTitle.textContent = 'Tell Gab about your dancing.';
    const applicationIntro = document.querySelector('#apply > .w > .muted');
    if (applicationIntro) applicationIntro.textContent = 'A few details are enough to start a conversation about fit. Applying does not enroll you or take a payment.';
  }

  const classPages = new Set(['/classes/','/brazilian-zouk-classes-nyc/','/lambada-classes-nyc/']);
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (!link || typeof window.gtag !== 'function') return;
    let url;
    try { url = new URL(link.href, location.origin); } catch { return; }
    let eventName, details;
    if (url.protocol === 'mailto:') {
      eventName = 'contact_click'; details = {contact_method: 'email'};
    } else if (url.protocol === 'https:' && ['wa.me','api.whatsapp.com'].includes(url.hostname)) {
      eventName = 'contact_click'; details = {contact_method: 'whatsapp'};
    } else if (url.origin === location.origin && classPages.has(url.pathname)) {
      eventName = 'class_details_click'; details = {class_page: url.pathname};
    } else return;
    try {
      window.gtag('event', eventName, {
        ...details,
        source_page: source,
        page_location: location.origin + (source === 'index' ? '/' : '/' + source + '/'),
        page_referrer: '',
        transport_type: 'beacon'
      });
    } catch { /* Measurement must never interrupt navigation. */ }
  });
})();