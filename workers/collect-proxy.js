// workers/collect-proxy.js
addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.pathname === '/collect.js') {
    return event.respondWith(handleCollectProxy(request, event));
  }
  // otherwise, let other routes fall through
});

async function handleCollectProxy(request, event) {
  const cache = caches.default;
  // Try cache
  let response = await cache.match(request);
  if (response) return response;

  // Fetch from NMI
  const upstream = await fetch('https://secure.nmi.com/token/Collect.js', {
    cf: { cacheTtl: 3600, cacheEverything: true }
  });

  // Clone headers, force CORS and correct content-type
  const headers = new Headers(upstream.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  // Ensure the browser sees it as JS
  headers.set('Content-Type', 'application/javascript; charset=utf-8');

  // Read the full body
  const body = await upstream.arrayBuffer();

  // Build a proper Response
  response = new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });

  // Cache it (don’t block the response)
  event.waitUntil(cache.put(request, response.clone()));

  return response;
}
