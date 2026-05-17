// GET /api/session — returns { authed: boolean }. Used by the admin shell to decide whether
// to show the login screen or the editor. Never throws.
import { isAuthed } from './_lib/auth.js';

export default function handler(req, res) {
  return res.status(200).json({ authed: isAuthed(req) });
}
