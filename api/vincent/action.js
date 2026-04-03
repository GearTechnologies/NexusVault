import { allowMethods, sendJson } from '../_lib/http.js';
import { kvGet, kvSet } from '../_lib/kv.js';
import { getVincentStatusKey } from '../_lib/workspace.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) {
    return;
  }

  const { walletAddress, action, payload } = req.body ?? {};
  if (!walletAddress || action !== 'publish_snapshot') {
    sendJson(res, 400, {
      error: 'walletAddress and publish_snapshot action are required.',
    });
    return;
  }

  const existing = (await kvGet(getVincentStatusKey(walletAddress))) ?? {};
  const receiptId = `vincent-${Date.now()}`;
  const nextStatus = {
    ...existing,
    installed: true,
    abilities: ['publish_snapshot'],
    latestReceiptId: receiptId,
    agentWalletAddress:
      existing.agentWalletAddress ?? process.env.VINCENT_AGENT_WALLET_ADDRESS ?? null,
    lastPayload: payload,
    updatedAt: Date.now(),
  };

  await kvSet(getVincentStatusKey(walletAddress), nextStatus);

  sendJson(res, 200, {
    receiptId,
    auditEvent: {
      status: 'success',
      summary: 'Vincent steward published a guarded workspace snapshot.',
    },
  });
}
