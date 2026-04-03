import { allowMethods, sendJson } from '../_lib/http.js';
import { kvSet } from '../_lib/kv.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) {
    return;
  }

  const timestamp = Date.now();
  await kvSet('nexusvault:continuity:last-cron-run', {
    ranAt: timestamp,
  });

  sendJson(res, 200, {
    ok: true,
    ranAt: timestamp,
  });
}
