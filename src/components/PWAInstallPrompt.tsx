import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { isPWAMode } from '../utils/pwa';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (isPWAMode() || localStorage.getItem('pwa-prompt-dismissed')) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS Safari users
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode && !localStorage.getItem('pwa-prompt-dismissed')) {
      setTimeout(() => setShowPrompt(true), 5000); // Show after 5 seconds
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">アプリをインストール</h3>
            <p className="text-sm opacity-90 mb-3">
              {isIOS 
                ? 'このアプリをホーム画面に追加して、より便利にご利用ください。'
                : 'アプリをインストールして、オフラインでも使用できるようにしましょう。'
              }
            </p>
            
            {isIOS ? (
              <div className="text-xs opacity-80 mb-3">
                <p>📱 Safari で「共有」→「ホーム画面に追加」をタップ</p>
              </div>
            ) : null}
            
            <div className="flex gap-2">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-white text-purple-600 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  インストール
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                後で
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white text-opacity-70 hover:text-opacity-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;