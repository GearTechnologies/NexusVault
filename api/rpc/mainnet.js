import { proxyRpcRequest } from '../_lib/rpc.js';
import { allowMethods, sendJson } from '../_lib/http.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) {
    return;
  }

  try {
    const result = await proxyRpcRequest('mainnet', req.body ?? {});
    res.status(result.status).setHeader('Content-Type', 'application/json');
    res.end(result.bodyText);
  } catch (error) {
    sendJson(res, 502, {
      error: error instanceof Error ? error.message : 'Mainnet RPC proxy failed.',
    });
  }
}
