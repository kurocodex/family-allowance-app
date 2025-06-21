import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase';
import { User, Mail, Lock, Eye, EyeOff, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

interface AccountSettingsProps {
  onClose: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleEmailUpdate = async () => {
    if (!formData.email || formData.email === user?.email) {
      setError('新しいメールアドレスを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Supabaseのメールアドレス変更リクエスト（確認メール送信）
      const { error: emailError } = await supabase.auth.updateUser({
        email: formData.email
      });

      if (emailError) throw emailError;

      // ⚠️ データベースの更新はメール確認完了まで待つ
      // 確認完了はauth state listenerで処理される
      
      setSuccess(`新しいメールアドレス（${formData.email}）に確認メールを送信しました。メール内のリンクをクリックして変更を完了してください。現在のメールアドレスは変更されていません。`);
      
      // フォームをリセット
      setFormData({ ...formData, email: user?.email || '' });

    } catch (err: any) {
      console.error('メールアドレス更新エラー:', err);
      setError(err.message || 'メールアドレスの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('すべてのパスワードフィールドを入力してください');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('新しいパスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 現在のパスワードを確認するため、一度サインインを試行
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: formData.currentPassword
      });

      if (signInError) {
        throw new Error('現在のパスワードが正しくありません');
      }

      // パスワードを更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) throw updateError;

      setSuccess('パスワードが正常に更新されました');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (err: any) {
      console.error('パスワード更新エラー:', err);
      setError(err.message || 'パスワードの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!formData.name || formData.name === user?.name) {
      setError('新しい名前を入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // データベースのユーザー名を更新
      const { error: dbError } = await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', user?.id);

      if (dbError) throw dbError;

      setSuccess('名前が正常に更新されました');
      
      // ローカルユーザー情報を更新
      if (updateUser) {
        updateUser({ ...user!, name: formData.name });
      }

    } catch (err: any) {
      console.error('名前更新エラー:', err);
      setError(err.message || '名前の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 lg:p-8 w-full max-w-2xl border-4 border-purple-300 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-purple-800 flex items-center gap-3">
            <User className="w-8 h-8" />
            ⚙️ アカウント設定
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 成功・エラーメッセージ */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* 基本情報セクション */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
              <User className="w-6 h-6" />
              基本情報
            </h3>
            
            <div className="space-y-4">
              {/* 名前 */}
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-2">
                  📝 お名前
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 input-field"
                    placeholder="お名前を入力"
                  />
                  <button
                    onClick={handleNameUpdate}
                    disabled={loading || !formData.name || formData.name === user?.name}
                    className="btn-primary px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    更新
                  </button>
                </div>
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-2">
                  📧 メールアドレス
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field pl-11"
                      placeholder="新しいメールアドレス"
                    />
                  </div>
                  <button
                    onClick={handleEmailUpdate}
                    disabled={loading || !formData.email || formData.email === user?.email}
                    className="btn-primary px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    更新
                  </button>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  ※ メールアドレス変更後は確認メールで認証が必要です
                </p>
              </div>
            </div>
          </div>

          {/* パスワード変更セクション */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
              <Lock className="w-6 h-6" />
              パスワード変更
            </h3>
            
            <div className="space-y-4">
              {/* 現在のパスワード */}
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-2">
                  🔒 現在のパスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="input-field pl-11 pr-11"
                    placeholder="現在のパスワード"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* 新しいパスワード */}
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-2">
                  🆕 新しいパスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="input-field pl-11 pr-11"
                    placeholder="新しいパスワード（6文字以上）"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* パスワード確認 */}
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-2">
                  ✅ パスワード確認
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field pl-11 pr-11"
                    placeholder="新しいパスワードを再入力"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePasswordUpdate}
                disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-5 h-5" />
                {loading ? '更新中...' : '🔐 パスワードを更新'}
              </button>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 pt-6 border-t border-purple-200 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="btn-secondary px-8 py-3"
          >
            🔙 閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;