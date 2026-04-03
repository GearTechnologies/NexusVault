import { recoverMessageAddress } from 'viem';
import { allowMethods, sendJson } from '../_lib/http.js';
import { kvSet } from '../_lib/kv.js';
import { uploadJsonWithStoracha } from '../_lib/storacha-server.js';
import { buildPublishMessage, getWorkspaceHeadKey } from '../_lib/workspace.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) {
    return;
  }

  const { walletAddress, workspaceDraft, clientSignature } = req.body ?? {};
  if (!walletAddress || !workspaceDraft?.manifestCid || !workspaceDraft?.auditCid) {
    sendJson(res, 400, {
      error: 'walletAddress, manifestCid, and auditCid are required.',
    });
    return;
  }

  if (clientSignature) {
    try {
      const recovered = await recoverMessageAddress({
        message: buildPublishMessage({
          walletAddress,
          manifestCid: workspaceDraft.manifestCid,
          auditCid: workspaceDraft.auditCid,
          publishedAt: workspaceDraft.publishedAt,
        }),
        signature: clientSignature,
      });

      if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        sendJson(res, 401, {
          error: 'Publish signature does not match the provided wallet.',
        });
        return;
      }
    } catch {
      sendJson(res, 401, {
        error: 'Invalid workspace publish signature.',
      });
      return;
    }
  }

  const headRecord = {
    walletAddress,
    manifestCid: workspaceDraft.manifestCid,
    auditCid: workspaceDraft.auditCid,
    continuityCid: workspaceDraft.continuityCid ?? null,
    publishedAt: workspaceDraft.publishedAt ?? Date.now(),
  };

  const headCid =
    (await uploadJsonWithStoracha(
      `workspace-head-${walletAddress.toLowerCase()}-${Date.now()}.json`,
      headRecord
    )) ?? workspaceDraft.manifestCid;

  const saved = {
    headCid,
    manifestCid: workspaceDraft.manifestCid,
    auditCid: workspaceDraft.auditCid,
    updatedAt: Date.now(),
  };

  await kvSet(getWorkspaceHeadKey(walletAddress), saved);

  sendJson(res, 200, saved);
}
