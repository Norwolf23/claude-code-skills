// POST /api/login  { password }  →  sets HttpOnly session cookie on success.
import { checkPassword, makeSessionCookie } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD env var is not set on the server' });
  }

  const raw = await readRawBody(req);
  let body;
  try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch { body = {}; }

  if (!checkPassword(body.password)) {
    // Constant-ish delay to discourage brute force on serverless cold starts.
    await new Promise((r) => setTimeout(r, 400));
    return res.status(401).json({ error: 'invalid password' });
  }

  res.setHeader('Set-Cookie', makeSessionCookie());
  return res.status(200).json({ ok: true });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
