// モバイルアプリ体験向上機能

export interface MobileFeatures {
  isInstalled: boolean;
  supportsPWA: boolean;
  hasNotificationSupport: boolean;
  hasVibrationSupport: boolean;
  isStandalone: boolean;
}

export const detectMobileFeatures = (): MobileFeatures => {
  // PWAインストール状態の検出
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true ||
                      document.referrer.includes('android-app://');

  return {
    isInstalled: isStandalone,
    supportsPWA: 'serviceWorker' in navigator,
    hasNotificationSupport: 'Notification' in window,
    hasVibrationSupport: 'vibrate' in navigator,
    isStandalone
  };
};

// ハプティックフィードバック（触覚フィードバック）
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // 軽いタップ
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25); // 中程度の振動
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 10, 50]); // 強い振動パターン
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([25, 25, 25]); // 成功時の振動
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100]); // エラー時の振動
    }
  }
};

// ボトムシート風モーダル
export const showMobileModal = (title: string, content: string, actions: Array<{text: string, action: () => void, style?: 'primary' | 'danger'}>) => {
  const overlay = document.createElement('div');
  overlay.className = 'mobile-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;
  `;

  const modal = document.createElement('div');
  modal.className = 'mobile-modal';
  modal.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 16px 16px 0 0;
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  // モーダル内容
  modal.innerHTML = `
    <div style="width: 40px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 0 auto 16px;"></div>
    <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 12px; color: #333;">${title}</h3>
    <p style="font-size: 16px; color: #666; margin: 0 0 24px; line-height: 1.5;">${content}</p>
    <div class="modal-actions" style="display: flex; flex-direction: column; gap: 12px;"></div>
  `;

  const actionsContainer = modal.querySelector('.modal-actions') as HTMLElement;
  
  actions.forEach(action => {
    const button = document.createElement('button');
    button.textContent = action.text;
    button.style.cssText = `
      padding: 16px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      ${action.style === 'danger' 
        ? 'background: #ff3b30; color: white;' 
        : action.style === 'primary' 
        ? 'background: #007aff; color: white;'
        : 'background: #f2f2f7; color: #007aff;'
      }
    `;
    
    button.addEventListener('click', () => {
      hapticFeedback.light();
      action.action();
      closeModal();
    });
    
    actionsContainer.appendChild(button);
  });

  const closeModal = () => {
    overlay.style.animation = 'fadeIn 0.2s ease-out reverse';
    modal.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => overlay.remove(), 300);
  };

  // 背景タップで閉じる
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // CSS アニメーション
  if (!document.querySelector('#mobile-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'mobile-modal-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }
};

// プル・トゥ・リフレッシュ（引っ張って更新）
export const addPullToRefresh = (onRefresh: () => Promise<void>) => {
  let startY = 0;
  let currentY = 0;
  let isPulling = false;
  let refreshIndicator: HTMLElement | null = null;

  const createRefreshIndicator = () => {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: transform 0.3s ease;
    `;
    indicator.innerHTML = '🔄';
    document.body.appendChild(indicator);
    return indicator;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
      if (!refreshIndicator) {
        refreshIndicator = createRefreshIndicator();
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return;
    
    currentY = e.touches[0].clientY;
    const pullDistance = Math.max(0, currentY - startY);
    
    if (pullDistance > 0 && window.scrollY === 0) {
      e.preventDefault();
      if (refreshIndicator) {
        const progress = Math.min(pullDistance / 100, 1);
        refreshIndicator.style.transform = `translateX(-50%) translateY(${pullDistance * 0.5}px) rotate(${progress * 360}deg)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    
    const pullDistance = currentY - startY;
    isPulling = false;
    
    if (pullDistance > 100) {
      // 更新をトリガー
      hapticFeedback.medium();
      if (refreshIndicator) {
        refreshIndicator.style.animation = 'spin 1s linear infinite';
      }
      
      onRefresh().finally(() => {
        if (refreshIndicator) {
          refreshIndicator.style.transform = 'translateX(-50%) translateY(-60px)';
          setTimeout(() => {
            refreshIndicator?.remove();
            refreshIndicator = null;
          }, 300);
        }
      });
    } else {
      // 元に戻す
      if (refreshIndicator) {
        refreshIndicator.style.transform = 'translateX(-50%) translateY(-60px)';
        setTimeout(() => {
          refreshIndicator?.remove();
          refreshIndicator = null;
        }, 300);
      }
    }
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);

  // CSS for spin animation
  if (!document.querySelector('#pull-refresh-styles')) {
    const style = document.createElement('style');
    style.id = 'pull-refresh-styles';
    style.textContent = `
      @keyframes spin {
        from { transform: translateX(-50%) rotate(0deg); }
        to { transform: translateX(-50%) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
};

// アプリインストール促進（強化版）
export const showAppInstallPromotion = () => {
  const features = detectMobileFeatures();
  
  if (features.isInstalled) return; // 既にインストール済み
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (!isIOS && !isAndroid) return; // モバイルではない
  
  const instructions = isIOS 
    ? '1. 画面下部の共有ボタン（□↑）をタップ\n2. 「ホーム画面に追加」を選択\n3. 「追加」をタップ'
    : '1. メニューから「ホーム画面に追加」を選択\n2. 「インストール」をタップ';
    
  showMobileModal(
    '📱 アプリをインストール',
    `このアプリをホーム画面に追加して、ネイティブアプリのように使いませんか？\n\n${instructions}`,
    [
      {
        text: '後で',
        action: () => {
          // 24時間後に再表示
          localStorage.setItem('install-prompt-dismissed', (Date.now() + 24 * 60 * 60 * 1000).toString());
        }
      },
      {
        text: 'インストール方法を見る',
        action: () => {
          hapticFeedback.success();
          // インストール手順を表示
        },
        style: 'primary'
      }
    ]
  );
};

// モバイル最適化の初期化
export const initializeMobileEnhancements = () => {
  const features = detectMobileFeatures();
  
  console.log('📱 Mobile Features:', features);
  
  // プル・トゥ・リフレッシュを追加
  addPullToRefresh(async () => {
    // ページリフレッシュロジック
    window.location.reload();
  });
  
  // インストール促進（24時間に1回）
  const lastDismissed = localStorage.getItem('install-prompt-dismissed');
  if (!lastDismissed || Date.now() > parseInt(lastDismissed)) {
    setTimeout(() => {
      showAppInstallPromotion();
    }, 5000); // 5秒後に表示
  }
  
  // ボタンクリック時のハプティックフィードバック
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      hapticFeedback.light();
    }
  });
  
  return features;
};