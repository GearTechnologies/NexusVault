import { allowMethods, sendJson } from '../_lib/http.js';
import { kvGet } from '../_lib/kv.js';
import { getVincentStatusKey } from '../_lib/workspace.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) {
    return;
  }

  const walletAddress = req.query.wallet;
  if (!walletAddress || typeof walletAddress !== 'string') {
    sendJson(res, 400, {
      error: 'wallet query parameter is required.',
    });
    return;
  }

  const saved = await kvGet(getVincentStatusKey(walletAddress));
  const enabled = Boolean(
    process.env.VINCENT_API_KEY ||
      process.env.VINCENT_AGENT_WALLET_ADDRESS ||
      process.env.VITE_VINCENT_ENABLED === 'true'
  );

  sendJson(res, 200, {
    enabled,
    installed: saved?.installed ?? enabled,
    agentWalletAddress:
      saved?.agentWalletAddress ?? process.env.VINCENT_AGENT_WALLET_ADDRESS ?? null,
    abilities: saved?.abilities ?? ['publish_snapshot'],
    latestReceiptId: saved?.latestReceiptId ?? null,
  });
}
