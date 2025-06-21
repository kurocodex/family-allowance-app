// PWA utilities for service worker registration and push notifications

interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Update found
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
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