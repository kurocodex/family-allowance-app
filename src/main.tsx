// Load polyfills first for browser compatibility
import './utils/polyfills'
import { initializePolyfills, checkBrowserCompatibility } from './utils/polyfills'
import './utils/cacheInvalidation'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Initialize polyfills and feature detection
initializePolyfills();

// Check browser compatibility
const compatibility = checkBrowserCompatibility();
if (!compatibility.compatible) {
  console.warn('[App] Browser compatibility issues detected:', compatibility.missingFeatures);
  
  // Show warning to user if critical features are missing
  const criticalMissing = compatibility.missingFeatures.filter(feature => 
    ['fetch', 'promises', 'localStorage'].includes(feature)
  );
  
  if (criticalMissing.length > 0) {
    const warningMessage = `このブラウザは一部の機能をサポートしていません: ${criticalMissing.join(', ')}。最新のブラウザをご使用ください。`;
    
    // Create warning banner
    const warningBanner = document.createElement('div');
    warningBanner.innerHTML = `
      <div style="
        background-color: #fef3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 12px;
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        <strong>ブラウザ互換性の警告:</strong> ${warningMessage}
        <button onclick="this.parentElement.style.display='none'" style="
          background: none;
          border: none;
          color: #856404;
          font-weight: bold;
          margin-left: 10px;
          cursor: pointer;
        ">×</button>
      </div>
    `;
    document.body.insertBefore(warningBanner, document.body.firstChild);
  }
}

// Error boundary for uncaught errors
window.addEventListener('error', (event) => {
  console.error('[App] Uncaught error:', event.error);
  
  // Report critical errors to user
  if (event.error && event.error.name === 'ChunkLoadError') {
    // Handle chunk loading errors (common in SPAs)
    const shouldReload = confirm(
      'アプリケーションの読み込みでエラーが発生しました。ページを再読み込みしますか？'
    );
    if (shouldReload) {
      window.location.reload();
    }
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[App] Unhandled promise rejection:', event.reason);
  
  // Prevent the default browser behavior (logging to console)
  event.preventDefault();
  
  // Handle specific error types
  if (event.reason && typeof event.reason === 'object') {
    if (event.reason.name === 'ChunkLoadError' || 
        event.reason.message?.includes('Loading chunk')) {
      // Handle chunk loading errors silently and offer reload
      const shouldReload = confirm(
        'アプリケーションの更新中にエラーが発生しました。ページを再読み込みしますか？'
      );
      if (shouldReload) {
        window.location.reload();
      }
    }
  }
});

// Performance monitoring
if ('performance' in window && performance.mark) {
  performance.mark('app-start');
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Render app with error handling
try {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  
  // Mark app as loaded
  if ('performance' in window && performance.mark) {
    performance.mark('app-rendered');
    performance.measure('app-startup', 'app-start', 'app-rendered');
  }
} catch (error) {
  console.error('[App] Failed to render application:', error);
  
  // Fallback UI
  const fallbackHtml = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    ">
      <h1 style="margin-bottom: 20px;">アプリケーションエラー</h1>
      <p style="margin-bottom: 30px; max-width: 500px; line-height: 1.6;">
        申し訳ございませんが、アプリケーションの読み込み中にエラーが発生しました。
        ブラウザを更新するか、しばらく時間をおいてから再度お試しください。
      </p>
      <button onclick="window.location.reload()" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        ページを再読み込み
      </button>
    </div>
  `;
  
  document.getElementById('root')!.innerHTML = fallbackHtml;
}