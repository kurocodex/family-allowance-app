// ネイティブアプリ専用機能
import { Capacitor } from '@capacitor/core';

// Capacitorプラグインの動的インポート（Webでエラーにならないように）
let Haptics: any = null;
let PushNotifications: any = null;
let LocalNotifications: any = null;
let StatusBar: any = null;
let SplashScreen: any = null;
let App: any = null;

// ネイティブ環境でのみプラグインを読み込み
if (Capacitor.isNativePlatform()) {
  import('@capacitor/haptics').then(m => Haptics = m.Haptics);
  import('@capacitor/push-notifications').then(m => PushNotifications = m.PushNotifications);
  import('@capacitor/local-notifications').then(m => LocalNotifications = m.LocalNotifications);
  import('@capacitor/status-bar').then(m => StatusBar = m.StatusBar);
  import('@capacitor/splash-screen').then(m => SplashScreen = m.SplashScreen);
  import('@capacitor/app').then(m => App = m.App);
}

export const nativeFeatures = {
  // プラットフォーム検出
  isNative: () => Capacitor.isNativePlatform(),
  isIOS: () => Capacitor.getPlatform() === 'ios',
  isAndroid: () => Capacitor.getPlatform() === 'android',
  
  // ハプティックフィードバック（ネイティブ版）
  haptic: {
    light: async () => {
      if (Haptics && Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: 'LIGHT' });
      }
    },
    medium: async () => {
      if (Haptics && Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: 'MEDIUM' });
      }
    },
    heavy: async () => {
      if (Haptics && Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: 'HEAVY' });
      }
    },
    success: async () => {
      if (Haptics && Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: 'SUCCESS' });
      }
    },
    warning: async () => {
      if (Haptics && Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: 'WARNING' });
      }
    },
    error: async () => {
      if (Haptics && Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: 'ERROR' });
      }
    }
  },
  
  // プッシュ通知
  pushNotifications: {
    async requestPermission() {
      if (PushNotifications && Capacitor.isNativePlatform()) {
        const result = await PushNotifications.requestPermissions();
        return result.receive === 'granted';
      }
      return false;
    },
    
    async register() {
      if (PushNotifications && Capacitor.isNativePlatform()) {
        await PushNotifications.register();
      }
    },
    
    onRegistration(callback: (token: string) => void) {
      if (PushNotifications && Capacitor.isNativePlatform()) {
        PushNotifications.addListener('registration', (token: any) => {
          callback(token.value);
        });
      }
    },
    
    onNotificationReceived(callback: (notification: any) => void) {
      if (PushNotifications && Capacitor.isNativePlatform()) {
        PushNotifications.addListener('pushNotificationReceived', callback);
      }
    }
  },
  
  // ローカル通知
  localNotifications: {
    async requestPermission() {
      if (LocalNotifications && Capacitor.isNativePlatform()) {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      }
      return false;
    },
    
    async schedule(notification: {
      title: string;
      body: string;
      id: number;
      schedule?: { at: Date };
    }) {
      if (LocalNotifications && Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [notification]
        });
      }
    },
    
    async cancel(id: number) {
      if (LocalNotifications && Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id }] });
      }
    }
  },
  
  // ステータスバー
  statusBar: {
    async setStyle(style: 'light' | 'dark') {
      if (StatusBar && Capacitor.isNativePlatform()) {
        await StatusBar.setStyle({ 
          style: style === 'light' ? 'LIGHT' : 'DARK' 
        });
      }
    },
    
    async setBackgroundColor(color: string) {
      if (StatusBar && Capacitor.isNativePlatform()) {
        await StatusBar.setBackgroundColor({ color });
      }
    },
    
    async hide() {
      if (StatusBar && Capacitor.isNativePlatform()) {
        await StatusBar.hide();
      }
    },
    
    async show() {
      if (StatusBar && Capacitor.isNativePlatform()) {
        await StatusBar.show();
      }
    }
  },
  
  // スプラッシュスクリーン
  splashScreen: {
    async hide() {
      if (SplashScreen && Capacitor.isNativePlatform()) {
        await SplashScreen.hide();
      }
    },
    
    async show() {
      if (SplashScreen && Capacitor.isNativePlatform()) {
        await SplashScreen.show();
      }
    }
  },
  
  // アプリライフサイクル
  app: {
    onStateChange(callback: (state: { isActive: boolean }) => void) {
      if (App && Capacitor.isNativePlatform()) {
        App.addListener('appStateChange', callback);
      }
    },
    
    onResume(callback: () => void) {
      if (App && Capacitor.isNativePlatform()) {
        App.addListener('resume', callback);
      }
    },
    
    onPause(callback: () => void) {
      if (App && Capacitor.isNativePlatform()) {
        App.addListener('pause', callback);
      }
    },
    
    async exitApp() {
      if (App && Capacitor.isNativePlatform()) {
        await App.exitApp();
      }
    }
  }
};

// ネイティブ機能の初期化
export const initializeNativeFeatures = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Web環境: ネイティブ機能は無効');
    return;
  }
  
  console.log(`ネイティブ環境検出: ${Capacitor.getPlatform()}`);
  
  // スプラッシュスクリーンを隠す
  setTimeout(async () => {
    await nativeFeatures.splashScreen.hide();
  }, 2000);
  
  // ステータスバーの設定
  await nativeFeatures.statusBar.setStyle('dark');
  await nativeFeatures.statusBar.setBackgroundColor('#8B5CF6');
  
  // プッシュ通知の初期化
  const pushPermission = await nativeFeatures.pushNotifications.requestPermission();
  if (pushPermission) {
    await nativeFeatures.pushNotifications.register();
    
    nativeFeatures.pushNotifications.onRegistration((token) => {
      console.log('Push token:', token);
      // サーバーにトークンを送信
    });
    
    nativeFeatures.pushNotifications.onNotificationReceived((notification) => {
      console.log('通知受信:', notification);
      // 通知処理
    });
  }
  
  // ローカル通知の初期化
  await nativeFeatures.localNotifications.requestPermission();
  
  // アプリライフサイクルの監視
  nativeFeatures.app.onStateChange((state) => {
    console.log('アプリ状態変更:', state);
  });
  
  nativeFeatures.app.onResume(() => {
    console.log('アプリ復帰');
    // データの再同期など
  });
  
  nativeFeatures.app.onPause(() => {
    console.log('アプリ一時停止');
    // 必要に応じてデータ保存
  });
};

// タスク完了時の通知例
export const notifyTaskCompletion = async (taskName: string, points: number) => {
  // ハプティックフィードバック
  await nativeFeatures.haptic.success();
  
  // ローカル通知
  await nativeFeatures.localNotifications.schedule({
    title: 'タスク完了！',
    body: `${taskName}を完了して${points}ポイント獲得しました！`,
    id: Date.now()
  });
};

// 新しいタスクの通知
export const notifyNewTask = async (taskName: string) => {
  await nativeFeatures.haptic.light();
  
  await nativeFeatures.localNotifications.schedule({
    title: '新しいタスク',
    body: `${taskName}が追加されました`,
    id: Date.now()
  });
};

// 承認/却下の通知
export const notifyTaskApproval = async (taskName: string, approved: boolean) => {
  if (approved) {
    await nativeFeatures.haptic.success();
  } else {
    await nativeFeatures.haptic.warning();
  }
  
  await nativeFeatures.localNotifications.schedule({
    title: approved ? 'タスク承認' : 'タスク却下',
    body: `${taskName}が${approved ? '承認' : '却下'}されました`,
    id: Date.now()
  });
};