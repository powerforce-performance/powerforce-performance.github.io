const C='pf-app-v2';
const SHELL=['./','index.html','manifest.json','icon-192.png','data/gym.json','data/saha.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  const net=/\/(index\.html|data\/)|\/$/.test(u.pathname);
  e.respondWith(net
    ? fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request))
    : caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{ if(r.ok&&/\/sp\//.test(u.pathname)){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))} return r})));
});
