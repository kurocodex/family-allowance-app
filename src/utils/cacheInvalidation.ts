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
    notification.style.cssText = `
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
    `;

    // 通知内容を作成
    const content = document.createElement('div');
    
    // ヘッダー部分
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; gap: 12px;';
    
    const emoji = document.createElement('div');
    emoji.style.cssText = 'font-size: 24px;';
    emoji.textContent = '🎉';
    
    const textContainer = document.createElement('div');
    
    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
    title.textContent = '新しいバージョンが利用可能です';
    
    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size: 14px; opacity: 0.9;';
    subtitle.textContent = 'より良い体験のためにアップデートしませんか？';
    
    textContainer.appendChild(title);
    textContainer.appendChild(subtitle);
    header.appendChild(emoji);
    header.appendChild(textContainer);
    
    // ボタン部分
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin-top: 12px; display: flex; gap: 8px;';
    
    const updateButton = document.createElement('button');
    updateButton.style.cssText = `
      background: white;
      color: #667eea;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    `;
    updateButton.textContent = 'アップデート';
    updateButton.addEventListener('click', async () => {
      await this.handleAppUpdate();
    });
    
    const laterButton = document.createElement('button');
    laterButton.style.cssText = `
      background: transparent;
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    `;
    laterButton.textContent = '後で';
    laterButton.addEventListener('click', () => {
      notification.remove();
    });
    
    buttonContainer.appendChild(updateButton);
    buttonContainer.appendChild(laterButton);
    
    content.appendChild(header);
    content.appendChild(buttonContainer);
    notification.appendChild(content);

    // CSSアニメーションを追加
    if (!document.querySelector('#update-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'update-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

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
      // 更新中のフィードバックを表示
      const notification = document.querySelector('.app-update-notification');
      if (notification) {
        const button = notification.querySelector('button');
        if (button) {
          button.textContent = '更新中...';
          button.disabled = true;
        }
      }

      // Service Workerの更新を強制
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          // 新しいService Workerを強制インストール
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          // Service Workerを更新
          await registration.update();
        }
      }

      // キャッシュをクリア
      await this.clearCaches();
      
      // LocalStorageの一時データをクリア（ユーザーデータは保持）
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('user') && !key.includes('auth') && !key.includes('settings')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 強制リロード（キャッシュバスト）
      window.location.href = window.location.origin + window.location.pathname + '?updated=' + Date.now();
      
    } catch (error) {
      console.error('アプリ更新エラー:', error);
      // エラーが発生した場合でも強制リロード
      window.location.reload(true);
    }
  }
}

// グローバルインスタンス
export const cacheManager = new CacheInvalidationManager();

// 手動更新用のユーティリティ
export async function forceAppUpdate(): Promise<void> {
  await cacheManager.handleAppUpdate();
}