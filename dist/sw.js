// Service Worker for PWA functionality - Enhanced version with automatic cache busting
const APP_VERSION = self.location.search.slice(1) || Date.now().toString();
const CACHE_NAME = `family-app-v${APP_VERSION}`;
const STATIC_CACHE = `static-${APP_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${APP_VERSION}`;

// キャッシュするリソースのパターン
const STATIC_URLS = [
  '/',
  '/manifest.json'
];

// ネットワーク優先で取得するリソース（常に最新が必要）
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /\.json$/
];

// キャッシュ優先で取得するリソース（静的アセット）
const CACHE_FIRST_PATTERNS = [
  /\/assets\/.*\.(js|css|png|jpg|jpeg|svg|woff|woff2)$/,
  /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(woff|woff2|eot|ttf)$/
];

// Install event - 重要な静的リソースを事前キャッシュ
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', APP_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static resources');
        return cache.addAll(STATIC_URLS.map(url => {
          // キャッシュバスティングのためのタイムスタンプ付与
          return new Request(url, { cache: 'no-cache' });
        }));
      })
      .then(() => {
        // 新しいサービスワーカーを即座にアクティブ化
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-caching failed:', error);
      })
  );
});

// Activate event - 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', APP_VERSION);
  event.waitUntil(
    Promise.all([
      // すべてのクライアントで新しいサービスワーカーを有効化
      self.clients.claim(),
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes(APP_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event - 高度なキャッシュ戦略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 外部ドメインの場合はスキップ
  if (url.origin !== self.location.origin && !url.origin.includes('supabase.co')) {
    return;
  }

  // ネットワーク優先戦略（API、動的データ）
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // キャッシュ優先戦略（静的アセット）
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // デフォルト: ステイル・ワイル・リバリデート戦略
  event.respondWith(staleWhileRevalidate(request));
});

// ネットワーク優先戦略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // オフライン時のフォールバック
    if (request.destination === 'document') {
      return caches.match('/');
    }
    throw error;
  }
}

// キャッシュ優先戦略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache and network both failed:', request.url, error);
    throw error;
  }
}

// ステイル・ワイル・リバリデート戦略
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Network request failed:', request.url, error);
      return cachedResponse;
    });

  return cachedResponse || fetchPromise;
}

// キャッシュサイズ制限
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // 古いエントリから削除
    const itemsToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(itemsToDelete.map(key => cache.delete(key)));
  }
}

// 定期的なキャッシュクリーンアップ
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(
      Promise.all([
        limitCacheSize(DYNAMIC_CACHE, 50),
        limitCacheSize(STATIC_CACHE, 30)
      ])
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'アプリを開く',
        icon: '/pwa-64x64.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/pwa-64x64.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('家族お小遣い管理', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});