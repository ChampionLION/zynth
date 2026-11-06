// Every connection uses the same routes and application. Only public page shells
// and assets are cached here; account data lives in the account-scoped store.
const CACHE='zynth-app-shell-v8';
const ROUTES=['/','/dashboard','/quest','/grade','/events','/profile','/settings','/markmap','/leaderboard','/achievements','/chronicle','/download','/prestige','/reveal','/onboarding','/auth'];
const pagePath=url=>ROUTES.includes(url.pathname);
const asset=url=>url.origin===self.location.origin&&(url.pathname.startsWith('/_next/static/')||url.pathname.startsWith('/brand/')||url.pathname==='/favicon.svg'||url.pathname==='/_next/image'&&url.searchParams.get('url')?.startsWith('/brand/'));
const pageKey=(url,rsc)=>self.location.origin+url.pathname+(rsc?'?flight=1':'');
async function cachePage(path){
 const response=await fetch(path,{cache:'reload'});if(!response.ok)return;
 const cache=await caches.open(CACHE),html=await response.clone().text();
 const urls=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&'),self.location.origin)).filter(asset);
 for(const tag of html.matchAll(/<img\b[^>]*>/g))for(const match of tag[0].matchAll(/srcset="([^"]+)"/gi))for(const item of match[1].split(',')){const url=new URL(item.trim().split(/\s+/)[0].replaceAll('&amp;','&'),self.location.origin);if(asset(url))urls.push(url);}
 await Promise.all([...new Set(urls.map(u=>u.href))].map(async url=>{const res=await fetch(url);if(res.ok)await cache.put(url,res);}));
 await cache.put(self.location.origin+path,response);
}
self.addEventListener('install',event=>event.waitUntil((async()=>{for(const path of ROUTES)await cachePage(path);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();for(const name of await caches.keys())if((name.startsWith('zynth-offline-shell-')||name.startsWith('zynth-app-shell-'))&&name!==CACHE)await caches.delete(name);})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'||request.headers.get('RSC')==='1'){
  if(!pagePath(url))return;
  const rsc=request.headers.get('RSC')==='1',key=pageKey(url,rsc);
  event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const res=await fetch(request);if(res.ok){await cache.put(key,res.clone());return res;}if(res.status<500)return res;}catch{/* Use the same saved route. */}return await cache.match(key)||new Response('Your saved page is being prepared. Please try again.',{status:503});})());return;
 }
 if(asset(url))event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(request);if(saved)return saved;const res=await fetch(request);if(res.ok)await cache.put(request,res.clone());return res;})());
});
