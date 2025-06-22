// PWA utilities for service worker registration and push notifications

interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      // キャッシュバスティングのためのバージョンパラメータを追加
      const swUrl = `/sw.js?v=${Date.now()}`;
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('[PWA] Service Worker registered successfully:', registration);
      
      // 更新検出とユーザー通知
      registration.addEventListener('updatefound', () => {
        console.log('[PWA] Service Worker update found');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新しいバージョンが利用可能
              showUpdateAvailableNotification();
            }
          });
        }
      });
      
      // サービスワーカーからのメッセージを監視
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('[PWA] Cache updated:', event.data.url);
        }
      });
      
      // 定期的なキャッシュクリーンアップをトリガー
      setInterval(() => {
        if (registration.active) {
          registration.active.postMessage({ type: 'CLEANUP_CACHE' });
        }
      }, 30 * 60 * 1000); // 30分ごと
      
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }
  console.warn('[PWA] Service Worker not supported');
  return null;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // VAPID public key (you'll need to generate this for production)
    const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // TODO: Replace with actual key
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
    
    return {
      endpoint: subscription.endpoint,
      keys: {
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!)
      }
    };
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

export const checkPWAInstallPrompt = (): Promise<boolean> => {
  return new Promise((resolve) => {
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      resolve(true);
    });
    
    // If no prompt event fires within 3 seconds, assume not available
    setTimeout(() => resolve(false), 3000);
  });
};

export const installPWA = async (deferredPrompt: any): Promise<boolean> => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    return outcome === 'accepted';
  }
  return false;
};

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return window.btoa(binary);
}

// Check if app is running as PWA
export const isPWAMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Local notification (fallback for when push notifications are not available)
export const showLocalNotification = (title: string, body: string, icon?: string): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/pwa-192x192.png',
      badge: '/pwa-64x64.png'
    });
  }
};

// 新しいバージョンが利用可能な場合の通知
export const showUpdateAvailableNotification = (): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('アプリの更新が利用可能です', {
      body: 'タップしてページを再読み込みし、最新バージョンを取得してください',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      requireInteraction: true,
      actions: [
        {
          action: 'reload',
          title: '今すぐ更新'
        },
        {
          action: 'dismiss',
          title: '後で'
        }
      ]
    });
    
    notification.onclick = () => {
      window.location.reload();
      notification.close();
    };
  } else {
    // フォールバック: コンソールログまたはUIでの通知
    console.log('[PWA] App update available - please refresh the page');
  }
};

// ブラウザ機能検出
export const detectBrowserCapabilities = (): {
  serviceWorker: boolean;
  pushNotifications: boolean;
  webAssembly: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  fetch: boolean;
  promises: boolean;
  modules: boolean;
} => {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window && 'Notification' in window,
    webAssembly: 'WebAssembly' in window,
    indexedDB: 'indexedDB' in window,
    localStorage: 'localStorage' in window && window.localStorage !== null,
    sessionStorage: 'sessionStorage' in window && window.sessionStorage !== null,
    fetch: 'fetch' in window,
    promises: 'Promise' in window,
    modules: 'noModule' in HTMLScriptElement.prototype
  };
};

// ブラウザ互換性チェック
export const checkBrowserCompatibility = (): { compatible: boolean; missingFeatures: string[] } => {
  const capabilities = detectBrowserCapabilities();
  const requiredFeatures: (keyof typeof capabilities)[] = [
    'fetch', 'promises', 'localStorage', 'sessionStorage'
  ];
  
  const missingFeatures = requiredFeatures.filter(feature => !capabilities[feature]);
  
  return {
    compatible: missingFeatures.length === 0,
    missingFeatures
  };
};

// キャッシュの手動クリア（デバッグ用）
export const clearAllCaches = async (): Promise<void> => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] All caches cleared');
    } catch (error) {
      console.error('[PWA] Failed to clear caches:', error);
    }
  }
};

// アプリの強制更新
export const forceAppUpdate = async (): Promise<void> => {
  try {
    // キャッシュをクリア
    await clearAllCaches();
    
    // サービスワーカーを再登録
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }
    
    // ページを再読み込み
    window.location.reload();
  } catch (error) {
    console.error('[PWA] Force update failed:', error);
    // フォールバック: 単純な再読み込み
    window.location.reload();
  }
};

// オフライン状態の検出
export const setupOfflineDetection = (
  onOnline?: () => void,
  onOffline?: () => void
): void => {
  const handleOnline = () => {
    console.log('[PWA] Application is online');
    onOnline?.();
  };
  
  const handleOffline = () => {
    console.log('[PWA] Application is offline');
    onOffline?.();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 初期状態をチェック
  if (!navigator.onLine) {
    handleOffline();
  }
};

// パフォーマンス監視
export const setupPerformanceMonitoring = (): void => {
  if ('performance' in window && 'PerformanceObserver' in window) {
    try {
      // First Contentful Paint
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log(`[PWA] ${entry.name}:`, entry.startTime);
        });
      });
      
      observer.observe({ entryTypes: ['paint', 'navigation', 'resource'] });
    } catch (error) {
      console.warn('[PWA] Performance monitoring not available:', error);
    }
  }
};