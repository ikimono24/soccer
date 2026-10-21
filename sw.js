// オフライン用キャッシュ（バージョン d0ff0eae）
const CACHE = 'soccer-m-d0ff0eae';
const CORE = ['./', './index.html',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon.png'];
self.addEventListener('install', e => {
  // ブラウザのキャッシュを通さずに取り直す（古いファイルを新しいキャッシュに入れないため）
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // ページ本体: ネット優先（更新をすぐ反映）、つながらなければキャッシュ
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // マニフェスト（アプリ名・アイコンの設定）: 常にネット優先
  if (url.pathname.endsWith('.webmanifest')) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => caches.match(req)));
    return;
  }
  // それ以外（アイコン・Googleフォント）: キャッシュ優先、なければ取得して保存
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
