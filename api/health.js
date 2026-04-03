import { kvStatus } from './_lib/kv.js';
import { sendJson, allowMethods } from './_lib/http.js';
import { storachaServerStatus } from './_lib/storacha-server.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) {
    return;
  }

  sendJson(res, 200, {
    ok: true,
    storacha: storachaServerStatus(),
    lit: process.env.LIT_API_KEY ? 'configured' : 'client-runtime',
    vincent:
      process.env.VINCENT_API_KEY || process.env.VINCENT_AGENT_WALLET_ADDRESS
        ? 'configured'
        : 'disabled',
    kv: await kvStatus(),
  });
}
