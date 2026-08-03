// CMS content endpoint.
// GET  → public; returns the latest saved content blob (or empty so the client falls back to defaults).
// POST → requires a valid session cookie; replaces the entire content blob with the request body.
import { isAuthed } from './_lib/auth.js';
import { readContent, writeContent } from './_lib/store.js';

const MAX_BYTES = 256 * 1024; // hard cap so a runaway client can't blow up KV

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const content = await readContent();
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10, stale-while-revalidate=60');
    return res.status(200).json(content || {});
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'unauthorized' });

    const raw = await readRawBody(req);
    if (raw.length > MAX_BYTES) return res.status(413).json({ error: 'payload too large' });

    let parsed;
    try {
      parsed = JSON.parse(raw.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'invalid json' });
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return res.status(400).json({ error: 'content must be an object' });
    }

    await writeContent(parsed);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let len = 0;
    req.on('data', (c) => {
      chunks.push(c);
      len += c.length;
      if (len > MAX_BYTES * 2) req.destroy(); // abort obvious abuse
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
