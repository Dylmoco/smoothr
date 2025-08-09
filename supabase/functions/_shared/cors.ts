const WEBFLOW_ORIGIN = 'https://smoothr-cms.webflow.io';

function isProd() {
  return Deno.env.get('NODE_ENV') === 'production';
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const allowedEnv = Deno.env.get('FUNCTION_ALLOWED_ORIGINS');
  const allowedOrigins = allowedEnv
    ? allowedEnv.split(',').map(o => o.trim()).filter(Boolean)
    : null;

  const defaultOrigin = isProd() ? WEBFLOW_ORIGIN : '*';
  const requestOrigin = req.headers.get('Origin');
  let origin = defaultOrigin;

  if (allowedOrigins && allowedOrigins.length > 0) {
    if (allowedOrigins.includes('*')) {
      origin = '*';
    } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      origin = requestOrigin;
    } else {
      origin = allowedOrigins[0];
    }
  } else if (defaultOrigin !== '*' && requestOrigin === defaultOrigin) {
    origin = requestOrigin;
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    Vary: 'Origin',
  };
}
