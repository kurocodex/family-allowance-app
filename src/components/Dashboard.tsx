import React from 'react';
import { useAuth } from '../hooks/useAuth';
import ParentDashboard from './ParentDashboard';
import ChildDashboard from './ChildDashboard';
import { LogOut, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

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
            
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'PARENT' ? <ParentDashboard /> : <ChildDashboard />}
      </main>
    </div>
  );
};

export default Dashboard;