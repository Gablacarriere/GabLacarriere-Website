const clean = (value, max = 1200) =>
  String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max);

const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    RESEND_API_KEY,
    COACH_NOTIFICATION_EMAIL,
    RESEND_FROM_EMAIL
  } = process.env;

  if (!RESEND_API_KEY || !COACH_NOTIFICATION_EMAIL || !RESEND_FROM_EMAIL) {
    return res.status(503).json({ error: 'Application email is not configured' });
  }

  const body = req.body || {};

  // Honeypot for simple bots. Return success so bots do not learn the rule.
  if (clean(body.website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  const experience = clean(body.experience, 120);
  const focus = clean(body.focus, 120);
  const goal = clean(body.goal, 1200);
  const challenge = clean(body.challenge, 1200);
  const why = clean(body.why, 1200);

  if (!name || !isEmail(email) || !experience || !focus || !goal) {
    return res.status(400).json({ error: 'Please complete the required fields.' });
  }

  const subject = `Mentorship application — ${name}`;
  const text = [
    'New mentorship application from gablacarriere.com',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Partner-dance experience: ${experience}`,
    `Dance focus: ${focus}`,
    `Main goal: ${goal}`,
    challenge ? `Current challenge: ${challenge}` : '',
    why ? `Interest in mentorship: ${why}` : '',
    '',
    'Reply directly to the applicant using the email address above.'
  ].filter(Boolean).join('\n\n');

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [COACH_NOTIFICATION_EMAIL],
        reply_to: email,
        subject,
        text
      })
    });

    const data = await emailResponse.json().catch(() => ({}));

    if (!emailResponse.ok) {
      console.error('Mentorship application Resend error', data);
      return res.status(502).json({ error: 'The application could not be delivered.' });
    }

    return res.status(200).json({ ok: true, id: data.id || null });
  } catch (error) {
    console.error('Mentorship application error', error);
    return res.status(502).json({ error: 'The application could not be delivered.' });
  }
}
