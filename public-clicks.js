// Public-site interaction helpers + privacy-safe click counts.
(() => {
  const publicPages = new Set(['index','about','learn','method','movement-architecture','kinesthetic-practice','how-to-practice-zouk','classes','brazilian-zouk-classes-nyc','lambada-classes-nyc','zouk-nyc-guide','privates','mentorship','work-with-gab','workshops','experience','wedding','creative','zouk-bnb','journal','feedback','reviews','alex-de-carvalho','for-teachers']);
  const source = document.body.dataset.page;
  if (!publicPages.has(source)) return;

  // Keep the main Classes page decision-focused. Detailed teaching content still lives on its own pages.
  if (source === 'classes') {
    const removeSectionContaining = text => {
      for (const section of document.querySelectorAll('main section')) {
        if ((section.textContent || '').includes(text)) {
          section.remove();
          return;
        }
      }
    };

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

    // These are useful secondary destinations, but they distract from the class decision on this page.
    removeSectionContaining('What you train');
    removeSectionContaining('Learn between classes');
    removeSectionContaining('Visiting New York?');

    // FAQs should be available without visually dominating the page.
    document.querySelectorAll('#student-questions details[open]').forEach(item => item.removeAttribute('open'));
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
    // A click is intent to inquire, not a completed booking or sent message.
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