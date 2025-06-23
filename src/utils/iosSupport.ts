// iOS専用サポート機能
export interface iOSInfo {
  isIOS: boolean;
  isiOSSafari: boolean;
  version: string;
  isPWAInstalled: boolean;
  supportsServiceWorker: boolean;
}

export const detectIOS = (): iOSInfo => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isiOSSafari = isIOS && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
  
  // iOS バージョン検出
  const versionMatch = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  const version = versionMatch ? `${versionMatch[1]}.${versionMatch[2]}${versionMatch[3] ? '.' + versionMatch[3] : ''}` : 'Unknown';
  
  // PWAインストール状態の検出
  const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
  
  // Service Worker サポート検出（iOS 14.3+）
  const majorVersion = parseInt(version.split('.')[0]);
  const minorVersion = parseInt(version.split('.')[1]);
  const supportsServiceWorker = majorVersion > 14 || (majorVersion === 14 && minorVersion >= 3);
  
  return {
    isIOS,
    isiOSSafari,
    version,
    isPWAInstalled,
    supportsServiceWorker
  };
};

export const showIOSInstallPrompt = (): void => {
  const iosInfo = detectIOS();
  
  if (!iosInfo.isIOS || iosInfo.isPWAInstalled) return;
  
  // iOS インストール促進メッセージ
  const prompt = document.createElement('div');
  prompt.className = 'ios-install-prompt';
  prompt.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
    color: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,122,255,0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: slideUp 0.3s ease-out;
  `;
  
  prompt.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="font-size: 24px;">📱</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">アプリをインストール</div>
        <div style="font-size: 14px; opacity: 0.9;">
          Safariの共有ボタン → 「ホーム画面に追加」
        </div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 18px;
      ">×</button>
    </div>
  `;
  
  // CSS アニメーション追加
  if (!document.querySelector('#ios-install-styles')) {
    const style = document.createElement('style');
    style.id = 'ios-install-styles';
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(prompt);
  
  // 10秒後に自動非表示
  setTimeout(() => {
    if (prompt.parentNode) {
      prompt.style.animation = 'slideUp 0.3s ease-out reverse';
      setTimeout(() => prompt.remove(), 300);
    }
  }, 10000);
};

export const optimizeForIOS = (): void => {
  const iosInfo = detectIOS();
  
  if (!iosInfo.isIOS) return;
  
  // iOS 専用最適化
  if (iosInfo.isiOSSafari) {
    // Safari 特有の問題に対処
    
    // 1. viewport height 100vh 問題の動的解決
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100);
    });
    
    // 2. iOS キーボード対応
    const handleKeyboard = () => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };
    
    document.addEventListener('focusin', handleKeyboard);
    
    // 3. iOS スクロール最適化
    document.documentElement.style.webkitOverflowScrolling = 'touch';
  }
  
  // PWA インストール促進（Safari のみ）
  if (iosInfo.isiOSSafari && !iosInfo.isPWAInstalled) {
    // 初回訪問から3秒後に表示
    setTimeout(() => {
      showIOSInstallPrompt();
    }, 3000);
  }
};

export const getIOSCompatibilityReport = (): string => {
  const iosInfo = detectIOS();
  
  if (!iosInfo.isIOS) {
    return 'このデバイスはiOSではありません。';
  }
  
  const reports = [
    `📱 iOS ${iosInfo.version} 検出済み`,
    iosInfo.isiOSSafari ? '✅ Safari ブラウザ' : '⚠️ サードパーティブラウザ',
    iosInfo.isPWAInstalled ? '✅ PWAインストール済み' : '📲 PWAインストール可能',
    iosInfo.supportsServiceWorker ? '✅ Service Worker対応' : '⚠️ Service Worker制限あり',
  ];
  
  return reports.join('\n');
};