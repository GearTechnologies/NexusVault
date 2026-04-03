import { allowMethods, sendJson } from '../_lib/http.js';
import { fetchJsonByCid } from '../_lib/storacha-server.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) {
    return;
  }

  const { headCid } = req.body ?? {};
  if (!headCid) {
    sendJson(res, 400, {
      error: 'headCid is required.',
    });
    return;
  }

  try {
    const headOrManifest = await fetchJsonByCid(headCid);
    if (headOrManifest?.manifestCid) {
      const workspace = await fetchJsonByCid(headOrManifest.manifestCid);
      sendJson(res, 200, {
        workspace,
        headCid,
      });
      return;
    }

    sendJson(res, 200, {
      workspace: headOrManifest,
      headCid,
    });
  } catch (error) {
    sendJson(res, 502, {
      error: error instanceof Error ? error.message : 'Unable to restore workspace.',
    });
  }
}
