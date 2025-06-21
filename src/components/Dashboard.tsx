import React, { Suspense, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Settings } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import AccountSettings from './AccountSettings';

// レイジーローディングでダッシュボードを分割
const ParentDashboard = React.lazy(() => import('./ParentDashboard'));
const ChildDashboard = React.lazy(() => import('./ChildDashboard'));

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  🏰 おこづかいクエスト
                </h1>
                <p className="text-sm text-gray-600">
                  {user.name}さん ({user.role === 'PARENT' ? '保護者' : 'お子様'})
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <button
                onClick={() => setShowAccountSettings(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="アカウント設定"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">設定</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-purple-600 text-lg font-medium">ダッシュボードを読み込み中...</p>
            </div>
          </div>
        }>
          {user.role === 'PARENT' ? <ParentDashboard /> : <ChildDashboard />}
        </Suspense>
      </main>
    </div>
  );
};

export default Dashboard;