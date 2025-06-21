import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, Users, Mail, Key, Trash2, Crown, User as UserIcon } from 'lucide-react';

const FamilyManagement: React.FC = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    // 家族管理タブが選択されたときのみ読み込み
    if (user) {
      generateInviteCode();
    }
  }, [user]);

  // 家族メンバーデータの遅延読み込み
  const loadFamilyMembersOnDemand = async () => {
    if (familyMembers.length === 0) {
      await loadFamilyMembers();
    }
  };

  const loadFamilyMembers = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          role,
          birth_date,
          age,
          created_at
        `)
        .eq('family_id', user.familyId || '');

      if (error) throw error;

      const members: User[] = data.map(member => ({
        id: member.id,
        name: member.name,
        email: '', // メールは表示しない
        role: member.role as 'PARENT' | 'CHILD',
        birthDate: member.birth_date ? new Date(member.birth_date) : undefined,
        age: member.age,
        createdAt: new Date(member.created_at)
      }));

      setFamilyMembers(members);
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = () => {
    // 簡単な招待コード生成（実際の実装では、データベースに保存）
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  };

  const handleCreateChildAccount = async (childData: {
    name: string;
    age: number;
    birthDate?: Date;
  }) => {
    try {
      if (!user?.familyId) throw new Error('Family ID not found');

      // 子供用の仮パスワードを生成
      const tempPassword = `child${Math.random().toString(36).substring(2, 6)}`;
      const tempEmail = `${childData.name.toLowerCase()}.${user.familyId}@temp.local`;

      // Supabase Authでユーザー作成
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true, // メール確認をスキップ
      });

      if (authError) throw authError;

      if (authData.user) {
        // ユーザープロフィール作成
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            family_id: user.familyId,
            name: childData.name,
            role: 'CHILD',
            age: childData.age,
            birth_date: childData.birthDate || null,
          });

        if (profileError) throw profileError;

        // 家族メンバーリストを更新
        await loadFamilyMembers();
        
        alert(`子供アカウントが作成されました！\n\nログイン情報:\nメール: ${tempEmail}\nパスワード: ${tempPassword}\n\n※この情報を安全に保管してください`);
      }
    } catch (error) {
      console.error('Error creating child account:', error);
      alert('子供アカウントの作成に失敗しました');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('このメンバーを削除してもよろしいですか？\n※データも全て削除されます')) return;

    try {
      // Supabase Authからユーザー削除
      const { error: authError } = await supabase.auth.admin.deleteUser(memberId);
      if (authError) throw authError;

      // プロフィールも自動削除される（CASCADE設定のため）
      await loadFamilyMembers();
      alert('メンバーが削除されました');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('メンバーの削除に失敗しました');
    }
  };

  if (user?.role !== 'PARENT') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">家族管理は保護者のみアクセスできます</p>
      </div>
    );
  }

  // 初回は簡単な表示
  if (loading && familyMembers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-xl font-bold text-purple-700 mb-4">👨‍👩‍👧‍👦 家族管理</h3>
          <button
            onClick={loadFamilyMembersOnDemand}
            className="btn-primary"
          >
            家族メンバーを読み込む
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-purple-800">👨‍👩‍👧‍👦 家族管理</h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          子供を追加
        </button>
      </div>

      {/* 家族メンバー一覧 */}
      <div className="card">
        <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          家族メンバー ({familyMembers.length}人)
        </h3>

        <div className="grid gap-4">
          {familyMembers.map(member => (
            <div key={member.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {member.role === 'PARENT' ? <Crown className="w-8 h-8 text-yellow-500" /> : <UserIcon className="w-8 h-8 text-blue-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{member.name}</h4>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'PARENT' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {member.role === 'PARENT' ? '保護者' : '子供'}
                      </span>
                      {member.age && <span>{member.age}歳</span>}
                      <span>参加日: {member.createdAt.toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </div>
                
                {member.role === 'CHILD' && (
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {familyMembers.length === 1 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">まだ子供が参加していません</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-secondary"
            >
              最初の子供を追加する
            </button>
          </div>
        )}
      </div>

      {/* 子供追加モーダル */}
      {showInviteModal && (
        <CreateChildModal
          onClose={() => setShowInviteModal(false)}
          onSave={handleCreateChildAccount}
        />
      )}
    </div>
  );
};

interface CreateChildModalProps {
  onClose: () => void;
  onSave: (data: { name: string; age: number; birthDate?: Date }) => void;
}

const CreateChildModal: React.FC<CreateChildModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    birthDate: ''
  });

  // 誕生日から年齢を自動計算
  const calculateAgeFromBirthDate = (birthDate: string) => {
    if (!birthDate) return '';
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  // 誕生日変更時に年齢を自動更新
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    const calculatedAge = calculateAgeFromBirthDate(birthDate);
    
    setFormData({ 
      ...formData, 
      birthDate,
      age: calculatedAge
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('名前は必須です');
      return;
    }

    // 年齢は誕生日から計算、または手動入力
    let finalAge: number;
    if (formData.birthDate) {
      finalAge = parseInt(calculateAgeFromBirthDate(formData.birthDate));
    } else if (formData.age) {
      finalAge = parseInt(formData.age);
    } else {
      alert('誕生日または年齢のどちらかを入力してください');
      return;
    }

    // 最小年齢チェックを緩和（1歳以上）
    if (finalAge < 1 || finalAge > 18) {
      alert('年齢は1歳から18歳までの範囲で入力してください');
      return;
    }

    onSave({
      name: formData.name,
      age: finalAge,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 w-full max-w-md border-4 border-purple-300 shadow-2xl">
        <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">
          👶 子供アカウントを作成
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">名前</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="例: 太郎"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">誕生日</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={handleBirthDateChange}
              className="input-field"
              max={new Date().toISOString().split('T')[0]} // 今日以前の日付のみ
            />
            <p className="text-xs text-purple-600 mt-1">誕生日を入力すると年齢が自動計算されます</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">年齢 {formData.birthDate && '(自動計算)'}</label>
            <input
              type="number"
              min="1"
              max="18"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="input-field"
              placeholder="例: 8"
              disabled={!!formData.birthDate} // 誕生日入力時は無効化
            />
            <p className="text-xs text-purple-600 mt-1">
              {formData.birthDate ? '誕生日から自動計算されています' : '誕生日未入力の場合は手動で入力してください'}
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyManagement;