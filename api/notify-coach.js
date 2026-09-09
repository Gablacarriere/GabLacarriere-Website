export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY,
    COACH_NOTIFICATION_EMAIL,
    RESEND_FROM_EMAIL
  } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Supabase server configuration missing'
    });
  }

  if (!RESEND_API_KEY || !COACH_NOTIFICATION_EMAIL || !RESEND_FROM_EMAIL) {
    return res.status(503).json({
      error: 'Email notifications are not configured'
    });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : '';

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const userResponse = await fetch(
    `${SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!userResponse.ok) {
    return res.status(401).json({
      error: 'Invalid session'
    });
  }

  const user = await userResponse.json();
  const body = req.body || {};

  if (body.kind !== 'needs_gab') {
    return res.status(400).json({
      error: 'Unsupported notification type'
    });
  }

  const clean = value =>
    String(value ?? '')
      .replace(/[<>]/g, '')
      .slice(0, 500);

  const goal = clean(
    body.goal || 'Training mission'
  );

  const diagnosis = clean(
    body.diagnosis || 'Not specified'
  );

  const context = clean(
    body.context || 'Not specified'
  );

  const minutes = Number(
    body.minutes || 0
  );

  const student = clean(
    user.user_metadata?.display_name ||
    user.email ||
    'Student'
  );

  const subject =
    `Needs Gab · ${student} · ${goal}`;

  const text = [
    `${student} requested coach input in the mentorship portal.`,
    '',
    `Goal: ${goal}`,
    `Diagnosis: ${diagnosis}`,
    `Context: ${context}`,
    `Mission length: ${
      Number.isFinite(minutes)
        ? minutes
        : 0
    } minutes`,
    '',
    'Open the mentorship dashboard to review and resolve the priority signal:',
    'https://gablacarriere.com/mentorship-hub/'
  ].join('\n');

  const emailResponse = await fetch(
    'https://api.resend.com/emails',
    {
      method: 'POST',
      headers: {
        Authorization:
          `Bearer ${RESEND_API_KEY}`,
        'Content-Type':
          'application/json'
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [
          COACH_NOTIFICATION_EMAIL
        ],
        subject,
        text
      })
    }
  );

  const emailData =
    await emailResponse
      .json()
      .catch(() => ({}));

  if (!emailResponse.ok) {
    console.error(
      'Resend error',
      emailData
    );

    return res.status(502).json({
      error:
        'Email provider rejected notification'
    });
  }

  return res.status(200).json({
    ok: true,
    id: emailData.id || null
  });
}
