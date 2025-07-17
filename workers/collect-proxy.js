// workers/collect-proxy.js
addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    // Only proxy the /collect.js path
    if (url.pathname === '/collect.js') {
      event.respondWith(handleCollectProxy(event.request));
    }
  });
  
  async function handleCollectProxy(request) {
    const cache = caches.default;
    // Check cache first
    let response = await cache.match(request);
    if (!response) {
      // Fetch from NMI, with Cloudflare edge caching
      const upstream = await fetch('https://secure.nmi.com/token/Collect.js', {
        cf: { cacheTtl: 3600, cacheEverything: true }
      });
      response = new Response(upstream.body, upstream);
      // Allow CORS so your page can load it
      response.headers.set('Access-Control-Allow-Origin', '*');
      // Store in cache
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  }
  