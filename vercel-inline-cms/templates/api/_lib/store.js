// Content storage. Auto-selects a backend based on which Vercel-provisioned env vars
// are present, in this order of preference:
//
//   1. Vercel KV (legacy)             — KV_REST_API_URL + KV_REST_API_TOKEN
//   2. Upstash Redis (Marketplace)    — UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//   3. Vercel Blob                    — BLOB_READ_WRITE_TOKEN
//
// Both KV and Upstash speak the Upstash REST protocol, so a single fetch-based client
// works for either. Vercel Blob stores the whole content blob as one JSON file.
//
// If none of those env vars are set:
//   - In local dev (process.env.VERCEL is unset) the store falls back to an in-memory
//     map so `vercel dev` boots cleanly. State resets on every process restart.
//   - On Vercel (process.env.VERCEL is set) the API throws a clear error pointing the
//     operator at `vercel storage create`. Silently returning {} would let edits appear
//     to save then vanish on the next request.
//
// The storage key/blob filename can be overridden with CMS_CONTENT_KEY (default 'site:content').
const KEY = process.env.CMS_CONTENT_KEY || 'site:content';
const BLOB_FILENAME = `${KEY.replace(/[^a-z0-9._-]/gi, '-')}.json`;

function pickBackend() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      kind: 'redis',
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    };
  }
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      kind: 'redis',
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return { kind: 'blob', token: process.env.BLOB_READ_WRITE_TOKEN };
  }
  return null;
}

let memoryFallback = null;

function isLocalDev() {
  return !process.env.VERCEL;
}

function noBackendError() {
  return new Error(
    'No CMS storage backend configured. Run `vercel storage create kv` ' +
      '(or `vercel storage create blob`) and re-deploy, or `vercel env pull` to ' +
      'sync the new env vars locally.'
  );
}

// --- Redis (Vercel KV / Upstash) via REST ---
async function redisGet(backend) {
  const res = await fetch(`${backend.url}/get/${encodeURIComponent(KEY)}`, {
    headers: { Authorization: `Bearer ${backend.token}` },
  });
  if (!res.ok) throw new Error(`Redis GET failed: ${res.status}`);
  const data = await res.json();
  if (data?.result == null) return null;
  try {
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch {
    return data.result;
  }
}

async function redisSet(backend, content) {
  const body = JSON.stringify(content);
  const res = await fetch(`${backend.url}/set/${encodeURIComponent(KEY)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${backend.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Redis SET failed: ${res.status}`);
}

// --- Vercel Blob ---
// Lazy-import @vercel/blob so projects that don't use Blob don't need the dep.
let blobMod = null;
async function blob() {
  if (!blobMod) {
    try {
      blobMod = await import('@vercel/blob');
    } catch {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN is set but @vercel/blob is not installed. ' +
          'Run: npm install @vercel/blob'
      );
    }
  }
  return blobMod;
}

async function blobGet(backend) {
  const { list } = await blob();
  const { blobs } = await list({ prefix: BLOB_FILENAME, token: backend.token });
  const match = blobs.find((b) => b.pathname === BLOB_FILENAME);
  if (!match) return null;
  const res = await fetch(match.url);
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function blobSet(backend, content) {
  const { put } = await blob();
  await put(BLOB_FILENAME, JSON.stringify(content), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: backend.token,
  });
}

export async function readContent() {
  const backend = pickBackend();
  if (!backend) {
    if (isLocalDev()) return memoryFallback;
    throw noBackendError();
  }
  try {
    if (backend.kind === 'redis') return await redisGet(backend);
    if (backend.kind === 'blob') return await blobGet(backend);
  } catch (e) {
    console.error('CMS store read failed:', e);
    return null;
  }
  return null;
}

export async function writeContent(content) {
  const backend = pickBackend();
  if (!backend) {
    if (isLocalDev()) {
      memoryFallback = content;
      return;
    }
    throw noBackendError();
  }
  if (backend.kind === 'redis') return redisSet(backend, content);
  if (backend.kind === 'blob') return blobSet(backend, content);
}
