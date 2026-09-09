const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROVISIONING_SECRET = process.env.PROVISIONING_SECRET;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function randomPassword() {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "23456789";
  const symbols = "!@#$%*-_";
  const all = lower + upper + nums + symbols;

  const pick = (s) => s[crypto.randomInt(0, s.length)];

  let chars = [
    pick(lower),
    pick(upper),
    pick(nums),
    pick(symbols),
  ];

  while (chars.length < 20) {
    chars.push(pick(all));
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

async function supabaseAdmin(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();

  let body = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const response = await supabaseAdmin(
      `/admin/users?page=${page}&per_page=100`
    );

    if (!response.ok) {
      throw new Error(
        response.body?.msg ||
        response.body?.message ||
        "Unable to list Supabase users."
      );
    }

    const users = response.body?.users || [];

    const found = users.find(
      (user) =>
        (user.email || "").toLowerCase() ===
        email.toLowerCase()
    );

    if (found) {
      return found;
    }

    if (users.length < 100) {
      break;
    }
  }

  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, {
      error: "POST required",
    });
  }

  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !PROVISIONING_SECRET
  ) {
    return json(res, 500, {
      error:
        "Server provisioning environment is not configured.",
    });
  }

  const auth = req.headers.authorization || "";

  if (auth !== `Bearer ${PROVISIONING_SECRET}`) {
    return json(res, 401, {
      error: "Unauthorized",
    });
  }

  const {
    email,
    display_name,
    airtable_record_id,
  } = req.body || {};

  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();

  const cleanName = String(display_name || "").trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return json(res, 400, {
      error: "A valid email is required.",
    });
  }

  try {
    const existing =
      await findUserByEmail(cleanEmail);

    if (existing) {
      return json(res, 200, {
        ok: true,
        created: false,
        user_id: existing.id,
        email: existing.email,
        airtable_record_id:
          airtable_record_id || null,
      });
    }

    const temporary_password =
      randomPassword();

    const response = await supabaseAdmin(
      "/admin/users",
      {
        method: "POST",

        body: JSON.stringify({
          email: cleanEmail,

          password: temporary_password,

          email_confirm: true,

          user_metadata: {
            display_name:
              cleanName ||
              cleanEmail.split("@")[0],

            force_password_change: true,

            airtable_record_id:
              airtable_record_id || null,
          },
        }),
      }
    );

    if (!response.ok) {
      return json(res, response.status, {
        error:
          response.body?.msg ||
          response.body?.message ||
          "Supabase user creation failed.",

        details: response.body,
      });
    }

    return json(res, 201, {
      ok: true,

      created: true,

      user_id: response.body.id,

      email: response.body.email,

      temporary_password,

      airtable_record_id:
        airtable_record_id || null,
    });
  } catch (error) {
    return json(res, 500, {
      error:
        error.message ||
        "Provisioning failed.",
    });
  }
};
