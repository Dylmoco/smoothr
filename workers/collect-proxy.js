// workers/collect-proxy.js
addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Proxy all /collect.js and /token/* under our domain
  if (url.pathname === '/collect.js' || url.pathname.startsWith('/token/')) {
    event.respondWith(handleProxy(request, event));
  }
});

async function handleProxy(request, event) {
  const cache = caches.default;
  let response = await cache.match(request);
  if (response) return response;

  // Build upstream URL
  const upstreamUrl = request.url.replace(
    'https://sdk.smoothr.io',
    'https://secure.nmi.com'
  );

  const upstream = await fetch(upstreamUrl, {
    // for XHR calls to /token/api/create
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.body,
    cf: { cacheTtl: 3600, cacheEverything: true }
  });

  // Copy headers, set CORS
  const headers = new Headers(upstream.headers);
  headers.set('Access-Control-Allow-Origin', '*');

  // Figure out how to read the body
  const body = ['GET','HEAD'].includes(request.method)
    ? await upstream.arrayBuffer()
    : await upstream.text();

  response = new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });

  event.waitUntil(cache.put(request, response.clone()));
  return response;
}
