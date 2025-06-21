import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../utils/storage';
import { calculateAge } from '../utils/dateUtils';
import { LogIn, User } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // ユーザー情報を取得して動的に年齢を表示
    setUsers(storage.getUsers());
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    setError(''); // エラーをクリア
  };

  const parentUsers = users.filter(u => u.role === 'PARENT');
  const childUsers = users.filter(u => u.role === 'CHILD');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🏰 おこづかいクエスト
          </h1>
          <p className="text-gray-600">
            アカウントにログインしてください
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              {...register('email', { 
                required: 'メールアドレスを入力してください',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: '正しいメールアドレスを入力してください'
                }
              })}
              className="input-field"
              placeholder="example@mail.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              {...register('password', { 
                required: 'パスワードを入力してください',
                minLength: {
                  value: 4,
                  message: 'パスワードは4文字以上で入力してください'
                }
              })}
              className="input-field"
              placeholder="パスワード"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">👨‍👩‍👧‍👦 家族アカウント</h3>
            
            <div className="mb-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">👨‍👩 保護者</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                {parentUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleAccountSelect(user.email, 'demo')}
                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded text-left transition-colors"
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs opacity-75">{user.email}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">👧 お子様</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                {childUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleAccountSelect(user.email, 'demo')}
                    className="p-2 bg-pink-100 hover:bg-pink-200 rounded text-left transition-colors"
                  >
                    <div className="font-medium">
                      {user.name} ({user.birthDate ? `${calculateAge(user.birthDate)}歳` : `${user.age || 0}歳`})
                    </div>
                    <div className="text-xs opacity-75">{user.email}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-blue-600 mt-3 text-center">
              ⬆️ クリックで自動入力されます（パスワード: demo）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;