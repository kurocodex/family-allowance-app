import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationProvider } from './hooks/useNotifications';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { 
  registerServiceWorker, 
  requestNotificationPermission, 
  setupOfflineDetection,
  setupPerformanceMonitoring,
  checkBrowserCompatibility 
} from './utils/pwa';
import { cacheManager } from './utils/cacheInvalidation';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();
    
    // Setup offline detection
    setupOfflineDetection(
      () => {
        console.log('[App] Application is back online');
        // Optionally show a "back online" notification
      },
      () => {
        console.log('[App] Application is offline');
        // Optionally show an "offline" notification
      }
    );
    
    // Setup performance monitoring
    setupPerformanceMonitoring();
    
    // Initialize cache management system
    // Cache management is automatically initialized when imported
    
    // Request notification permission when user logs in
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <NotificationProvider>
          <Dashboard />
        </NotificationProvider>
      ) : (
        <AuthPage />
      )}
      <PWAInstallPrompt />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;