import { allowMethods, sendJson } from '../_lib/http.js';
import { kvGet } from '../_lib/kv.js';
import { getWorkspaceHeadKey } from '../_lib/workspace.js';

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

  const saved = await kvGet(getWorkspaceHeadKey(walletAddress));
  sendJson(res, 200, saved ?? { headCid: null, updatedAt: null });
}
