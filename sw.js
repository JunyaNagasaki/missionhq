const CACHE_NAME = 'missionhq-v5';
const ASSETS = ['/'];

// インストール：キャッシュ登録
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// アクティベート：古いキャッシュ削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ：キャッシュ優先、なければネットワーク
self.addEventListener('fetch', e => {
  // GASへのリクエストはキャッシュしない
  if (e.request.url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// プッシュ通知
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Mission HQ', {
      body: data.body || '今日のミッションを確認しよう！',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    })
  );
});

// 通知クリック
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url === '/' && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});

// 毎朝9時の通知スケジュール（バックグラウンド同期）
self.addEventListener('periodicsync', e => {
  if (e.tag === 'daily-mission-reminder') {
    e.waitUntil(
      self.registration.showNotification('Mission HQ', {
        body: '今日のミッションを確認しよう！',
        icon: '/icon-192.png'
      })
    );
  }
});
