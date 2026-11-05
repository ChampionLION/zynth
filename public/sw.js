/* Public app shell only. Account data, tokens, API responses and RSC payloads
 * never enter Cache Storage. Private lesson data uses an account-scoped store. */
const CACHE = 'zynth-offline-shell-v1';
const SHELL = '/offline';
const cacheable = url => url.origin === self.location.origin &&
  (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/brand/') || url.pathname === '/favicon.svg' ||
   (url.pathname === '/_next/image' && url.searchParams.get('url')?.startsWith('/brand/')));
async function saveAssets(html, cache) {
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => new URL(match[1].replaceAll('&amp;', '&'), self.location.origin))
    .filter(cacheable);
  for(const tag of html.matchAll(/<img\b[^>]*>/g)) for(const match of tag[0].matchAll(/srcset="([^"]+)"/gi))
    for(const source of match[1].split(',')) {
      const url=new URL(source.trim().split(/\s+/)[0].replaceAll('&amp;','&'),self.location.origin);
      if(cacheable(url))urls.push(url);
    }
  await Promise.all([...new Set(urls.map(url => url.href))].map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('An offline asset is unavailable');
    await cache.put(url, response);
  }));
}
async function warm() {
  const response = await fetch(SHELL, {cache:'reload'});
  if (!response.ok) throw new Error('Offline shell is unavailable');
  const cache = await caches.open(CACHE), html = await response.clone().text();
  await saveAssets(html, cache);
  await cache.put(SHELL, response);
}
self.addEventListener('install', event => event.waitUntil(warm().then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('zynth-offline-shell-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if(event.data?.type === 'CACHE_OFFLINE') event.waitUntil(warm().then(() => event.ports[0]?.postMessage({ok:true})).catch(() => event.ports[0]?.postMessage({ok:false})));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) return response;
        if(response.status < 500) return response;
      } catch { /* Offline or unreachable host: serve the complete cached app shell. */ }
      if(url.pathname!==SHELL) return Response.redirect(new URL(SHELL,self.location.origin).href,302);
      return await caches.match(SHELL) || new Response('Connect once to download your lessons.', {status:503,headers:{'Content-Type':'text/plain'}});
    })()); return;
  }
  if (cacheable(url)) event.respondWith((async () => {
    const cached = await caches.match(request); if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {const cache=await caches.open(CACHE);await cache.put(request,response.clone());}
    return response;
  })());
});
