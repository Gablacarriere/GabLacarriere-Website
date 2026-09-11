// Public-site click counts only. Never send destination queries or message text.
(() => {
  const publicPages = new Set(['index','about','learn','method','movement-architecture','kinesthetic-practice','how-to-practice-zouk','classes','brazilian-zouk-classes-nyc','lambada-classes-nyc','zouk-nyc-guide','privates','mentorship','work-with-gab','workshops','experience','wedding','creative','zouk-bnb','journal','feedback','reviews','alex-de-carvalho','for-teachers']);
  const source = document.body.dataset.page;
  if (!publicPages.has(source)) return;
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
