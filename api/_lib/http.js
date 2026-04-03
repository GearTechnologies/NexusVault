export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function allowMethods(req, res, methods) {
  if (!methods.includes(req.method)) {
    sendJson(res, 405, {
      error: `Method ${req.method} not allowed.`,
    });
    return false;
  }

  return true;
}
