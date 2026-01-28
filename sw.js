const CACHE_NAME = 'toilet-inspection-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('快取已開啟');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 啟動 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果有快取就回傳快取
        if (response) {
          return response;
        }
        
        // 否則從網路取得
        return fetch(event.request).then((response) => {
          // 檢查是否為有效回應
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 複製回應並快取
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // 離線時的備用回應
        return caches.match('/index.html');
      })
  );
});
