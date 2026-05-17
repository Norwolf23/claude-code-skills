// Shared auth helpers for the CMS API routes.
// Session is a single HttpOnly cookie carrying `<expiry>.<hmac>` signed with SESSION_SECRET.
// 7-day expiry. Refreshed lazily — if you visit /admin after 6 days, you stay logged in.
import crypto from 'node:crypto';

const COOKIE_NAME = 'cms_session';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  // Prefer a dedicated SESSION_SECRET; fall back to ADMIN_PASSWORD so the user only has to
  // configure one env var to get a working install. They can rotate by changing the password.
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-insecure-secret';
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

export function makeSessionCookie() {
  const expiry = Date.now() + ONE_WEEK_MS;
  const payload = String(expiry);
  const token = `${payload}.${sign(payload)}`;
  const attrs = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(ONE_WEEK_MS / 1000)}`,
  ];
  if (process.env.NODE_ENV === 'production') attrs.push('Secure');
  return attrs.join('; ');
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function isAuthed(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return false;
  const expected = sign(payload);
  // timing-safe comparison
  const a = Buffer.from(mac, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const expiry = Number(payload);
  return Number.isFinite(expiry) && expiry > Date.now();
}

export function checkPassword(submitted) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(String(submitted || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
