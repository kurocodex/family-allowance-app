// 自動キャッシュ無効化とアップデート検知
export interface AppVersion {
  version: string;
  buildTime: number;
  assets: string[];
}

class CacheInvalidationManager {
  private currentVersion: string;
  private checkInterval: number = 30000; // 30秒ごとにチェック
  private isChecking: boolean = false;

  constructor() {
    this.currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
    this.startVersionCheck();
  }

  // デプロイされた新しいバージョンを自動検知
  private async checkForUpdates(): Promise<boolean> {
    if (this.isChecking) return false;
    
    try {
      this.isChecking = true;
      
      // manifest.jsonから現在のバージョン情報を取得
      const response = await fetch('/version.json?' + Date.now(), {
        cache: 'no-cache'
      });
      
      if (!response.ok) return false;
      
      const remoteVersion: AppVersion = await response.json();
      
      // バージョンが異なる場合は更新が必要
      if (remoteVersion.version !== this.currentVersion) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('バージョンチェックに失敗:', error);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  // 定期的なバージョンチェック開始
  private startVersionCheck(): void {
    // ページが非表示の時はチェックを停止
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      
      this.checkForUpdates().then(hasUpdate => {
        if (hasUpdate) {
          this.notifyUpdate();
        }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 定期チェック
    setInterval(handleVisibilityChange, this.checkInterval);
  }

  // ユーザーフレンドリーな更新通知
  private notifyUpdate(): void {
    // 非侵入的な更新通知を表示
    this.showUpdateNotification();
  }

  private showUpdateNotification(): void {
    // 既に通知が表示されている場合は無視
    if (document.querySelector('.app-update-notification')) return;

    const notification = document.createElement('div');
    notification.className = 'app-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 320px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 24px;">🎉</div>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">新しいバージョンが利用可能です</div>
            <div style="font-size: 14px; opacity: 0.9;">より良い体験のためにアップデートしませんか？</div>
          </div>
        </div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button onclick="window.location.reload()" style="
            background: white;
            color: #667eea;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
          ">アップデート</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: transparent;
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">後で</button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // 10秒後に自動で非表示
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }

  // Service Workerキャッシュをクリア
  async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  // アプリケーション更新時の処理
  async handleAppUpdate(): Promise<void> {
    try {
      await this.clearCaches();
      
      // Service Workerを更新
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      
      // ページをリロード
      window.location.reload();
    } catch (error) {
      console.error('アプリ更新エラー:', error);
      // フォールバック: 強制リロード
      window.location.href = window.location.href;
    }
  }
}

// グローバルインスタンス
export const cacheManager = new CacheInvalidationManager();

// 手動更新用のユーティリティ
export async function forceAppUpdate(): Promise<void> {
  await cacheManager.handleAppUpdate();
}