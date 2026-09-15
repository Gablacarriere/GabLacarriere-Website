(() => {
  'use strict';

  const FALLBACKS = {
    teacher_studio: {
      product_key: 'teacher_studio',
      mode: 'beta',
      tier: 'free',
      full_access: true,
      free_limits: { curricula: 1, sessions: 3 },
      included_with_mentorship: false,
      reason: 'beta_preview'
    },
    zoukable: {
      product_key: 'zoukable',
      mode: 'beta',
      tier: 'free',
      full_access: true,
      free_limits: { starter_drills: 5, weekly_quests: 1 },
      included_with_mentorship: false,
      reason: 'beta_preview'
    }
  };

  const clone = value => JSON.parse(JSON.stringify(value));

  function fallback(productKey) {
    return clone(FALLBACKS[productKey] || FALLBACKS.teacher_studio);
  }

  async function resolve(client, productKey) {
    const safe = fallback(productKey);
    if (!client || !client.rpc) return safe;

    try {
      const { data, error } = await client.rpc('get_product_access', {
        p_product_key: productKey
      });
      if (error || !data || typeof data !== 'object') return safe;
      return {
        ...safe,
        ...data,
        free_limits: {
          ...safe.free_limits,
          ...(data.free_limits || {})
        }
      };
    } catch {
      return safe;
    }
  }

  function isFull(access) {
    return access?.full_access === true;
  }

  function label(access) {
    if (!access) return 'Access status unavailable';
    if (access.tier === 'staff') return 'Studio owner · Full access';
    if (access.tier === 'mentorship') return 'Mentorship · Full access included';
    if (access.tier === 'pro') return 'Full Studio · Subscription access';
    if (access.mode === 'beta') return 'Free beta · Full features temporarily unlocked';
    return 'Free Studio';
  }

  function detail(access) {
    if (!access) return '';
    if (access.tier === 'mentorship') {
      return 'Your mentorship includes the complete platform. No separate subscription is required.';
    }
    if (access.tier === 'pro' || access.tier === 'staff') {
      return 'All planning and methodology features are unlocked.';
    }
    if (access.mode === 'beta') {
      return 'You are testing the complete Studio during beta. At launch, the free tier keeps the core planning loop and advanced methodology tools move to Full Studio.';
    }
    const curricula = Number(access.free_limits?.curricula || 1);
    const sessions = Number(access.free_limits?.sessions || 3);
    return `Free Studio includes ${curricula} curriculum and ${sessions} saved sessions. Advanced methodology guidance and unlimited planning require Full Studio.`;
  }

  window.GAB_ACCESS = {
    resolve,
    fallback,
    isFull,
    label,
    detail
  };
})();
