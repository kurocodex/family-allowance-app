import React, { useState, useEffect } from 'react';
import { User, RateRule } from '../types';
import { storage } from '../utils/storage';
import { calculateAge } from '../utils/dateUtils';
import { Plus, Trash2 } from 'lucide-react';

const RateManagement: React.FC = () => {
  const [rates, setRates] = useState<RateRule[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [showCreateRate, setShowCreateRate] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'rules' | 'preview'>('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedRates = storage.getRateRules();
    setRates(savedRates);
    setChildren(storage.getUsers().filter(u => u.role === 'CHILD'));
  };

  const previewPointsForChild = (childId: string, basePoints: number, category: string) => {
    const child = children.find(c => c.id === childId);
    if (!child) return { finalPoints: basePoints, appliedRules: [] };

    const age = child.birthDate ? calculateAge(child.birthDate) : child.age || 0;
    const now = new Date();
    
    let finalPoints = basePoints;
    let appliedRules: string[] = [];

    // Apply all applicable rate rules
    rates
      .filter(rate => rate.isActive)
      .forEach(rate => {
        let applies = false;

        switch (rate.type) {
          case 'AGE_BASED':
            if (rate.conditions.minAge !== undefined && age >= rate.conditions.minAge &&
                (rate.conditions.maxAge === undefined || age <= rate.conditions.maxAge)) {
              applies = true;
            }
            break;
          
          case 'PERIOD_BASED':
            if (rate.conditions.startDate && rate.conditions.endDate) {
              const startDate = new Date(rate.conditions.startDate);
              const endDate = new Date(rate.conditions.endDate);
              if (now >= startDate && now <= endDate) {
                if (!rate.conditions.taskCategory || rate.conditions.taskCategory === category) {
                  applies = true;
                }
              }
            }
            break;
            
          case 'PERFORMANCE_BASED':
            // This would require checking completion history
            // For now, we'll implement a simple version
            if (!rate.conditions.taskCategory || rate.conditions.taskCategory === category) {
              applies = true;
            }
            break;
        }

        if (applies) {
          finalPoints = Math.round(finalPoints * rate.multiplier);
          if (rate.bonusPoints) {
            finalPoints += rate.bonusPoints;
          }
          appliedRules.push(rate.name);
        }
      });

    return { finalPoints, appliedRules };
  };

  const getActiveRulesForChild = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (!child) return [];

    const age = child.birthDate ? calculateAge(child.birthDate) : child.age || 0;
    const now = new Date();
    
    return rates
      .filter(rate => rate.isActive)
      .filter(rate => {
        switch (rate.type) {
          case 'AGE_BASED':
            return rate.conditions.minAge !== undefined && age >= rate.conditions.minAge &&
                   (rate.conditions.maxAge === undefined || age <= rate.conditions.maxAge);
          
          case 'PERIOD_BASED':
            if (rate.conditions.startDate && rate.conditions.endDate) {
              const startDate = new Date(rate.conditions.startDate);
              const endDate = new Date(rate.conditions.endDate);
              return now >= startDate && now <= endDate;
            }
            return false;
            
          case 'PERFORMANCE_BASED':
            return true; // Simplified for now
            
          default:
            return false;
        }
      });
  };

  const deleteRate = (rateId: string) => {
    if (confirm('このレート設定を削除してもよろしいですか？')) {
      const updatedRates = rates.filter(rate => rate.id !== rateId);
      setRates(updatedRates);
      storage.saveRateRules(updatedRates);
    }
  };

  const toggleRateStatus = (rateId: string) => {
    const updatedRates = rates.map(rate =>
      rate.id === rateId ? { ...rate, isActive: !rate.isActive } : rate
    );
    setRates(updatedRates);
    storage.saveRateRules(updatedRates);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-purple-800">⚙️ レート設定システム</h2>
        <button
          onClick={() => setShowCreateRate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          ✨ 新しいレート設定
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className="card">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              selectedTab === 'active'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔥 適用中のレート ({rates.filter(r => r.isActive).length})
          </button>
          <button
            onClick={() => setSelectedTab('rules')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              selectedTab === 'rules'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 全レート設定 ({rates.length})
          </button>
          <button
            onClick={() => setSelectedTab('preview')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              selectedTab === 'preview'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👀 ポイント計算プレビュー
          </button>
        </div>

        {/* タブ内容 */}
        {selectedTab === 'active' && (
          <div>
            <h3 className="text-xl font-bold text-green-700 mb-4">🔥 現在適用中のレート設定</h3>
            <div className="space-y-4">
              {rates.filter(rate => rate.isActive).map(rate => (
                <RateCard 
                  key={rate.id} 
                  rate={rate} 
                  onToggle={toggleRateStatus}
                  onDelete={deleteRate}
                  children={children}
                />
              ))}
              {rates.filter(rate => rate.isActive).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-green-600">📝 現在適用中のレート設定はありません</p>
                  <p className="text-green-500 text-sm mt-2">新しいレート設定を作成してみてください。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'rules' && (
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4">📋 すべてのレート設定</h3>
            <div className="space-y-4">
              {rates.map(rate => (
                <RateCard 
                  key={rate.id} 
                  rate={rate} 
                  onToggle={toggleRateStatus}
                  onDelete={deleteRate}
                  children={children}
                />
              ))}
              {rates.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">📝 まだレート設定がありません</p>
                  <p className="text-gray-500 text-sm mt-2">最初のレート設定を作成してみてください。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'preview' && (
          <PointsPreview 
            children={children}
            previewFunction={previewPointsForChild}
            getActiveRules={getActiveRulesForChild}
          />
        )}
      </div>

      {showCreateRate && (
        <CreateRateModal
          onClose={() => setShowCreateRate(false)}
          onSave={loadData}
          children={children}
        />
      )}
    </div>
  );
};

interface RateCardProps {
  rate: RateRule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  children: User[];
}

const RateCard: React.FC<RateCardProps> = ({ rate, onToggle, onDelete }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AGE_BASED': return '👶';
      case 'PERIOD_BASED': return '📅';
      case 'PERFORMANCE_BASED': return '🏆';
      default: return '⚙️';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'AGE_BASED': return '年齢ベース';
      case 'PERIOD_BASED': return '期間ベース';
      case 'PERFORMANCE_BASED': return '実績ベース';
      default: return type;
    }
  };

  const getConditionText = (rate: RateRule) => {
    switch (rate.type) {
      case 'AGE_BASED':
        if (rate.conditions.minAge !== undefined) {
          const maxText = rate.conditions.maxAge !== undefined ? `${rate.conditions.maxAge}歳` : '以上';
          return `${rate.conditions.minAge}歳${rate.conditions.maxAge !== undefined ? `～${maxText}` : '以上'}`;
        }
        return '年齢条件なし';
        
      case 'PERIOD_BASED':
        if (rate.conditions.startDate && rate.conditions.endDate) {
          const start = new Date(rate.conditions.startDate).toLocaleDateString('ja-JP');
          const end = new Date(rate.conditions.endDate).toLocaleDateString('ja-JP');
          return `${start} ～ ${end}`;
        }
        return '期間設定なし';
        
      case 'PERFORMANCE_BASED':
        if (rate.conditions.completionCount) {
          return `${rate.conditions.completionCount}回以上完了`;
        }
        return '実績条件なし';
        
      default:
        return '条件不明';
    }
  };

  return (
    <div className={`p-6 rounded-2xl border-2 shadow-lg transition-all ${
      rate.isActive 
        ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-300'
        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getTypeIcon(rate.type)}</div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{rate.name}</h3>
            <p className="text-sm text-gray-600">{getTypeText(rate.type)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(rate.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              rate.isActive
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {rate.isActive ? '有効' : '無効'}
          </button>
          <button
            onClick={() => onDelete(rate.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">適用条件</p>
          <p className="font-medium text-gray-800">{getConditionText(rate)}</p>
        </div>
        
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">ポイント倍率</p>
          <p className="font-bold text-blue-600">{rate.multiplier}x</p>
        </div>
        
        {rate.bonusPoints && (
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">ボーナス</p>
            <p className="font-bold text-green-600">+{rate.bonusPoints}pt</p>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-700 mb-3">{rate.description}</p>
      
      {rate.conditions.taskCategory && (
        <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          対象: {rate.conditions.taskCategory}
        </div>
      )}
    </div>
  );
};

interface PointsPreviewProps {
  children: User[];
  previewFunction: (childId: string, basePoints: number, category: string) => { finalPoints: number; appliedRules: string[] };
  getActiveRules: (childId: string) => RateRule[];
}

const PointsPreview: React.FC<PointsPreviewProps> = ({ children, previewFunction, getActiveRules }) => {
  const [selectedBasePoints, setSelectedBasePoints] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('家事');

  const categories = ['家事', '勉強', '運動', 'その他'];

  return (
    <div>
      <h3 className="text-xl font-bold text-blue-700 mb-4">👀 ポイント計算プレビュー</h3>
      
      {/* 設定パネル */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">基本ポイント</label>
            <input
              type="number"
              value={selectedBasePoints}
              onChange={(e) => setSelectedBasePoints(parseInt(e.target.value) || 10)}
              className="input-field"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">カテゴリ</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* プレビュー結果 */}
      <div className="space-y-4">
        {children.map(child => {
          const { finalPoints, appliedRules } = previewFunction(child.id, selectedBasePoints, selectedCategory);
          const activeRules = getActiveRules(child.id);
          
          return (
            <div key={child.id} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-orange-800">{child.name}</h4>
                  <p className="text-sm text-orange-600">
                    {child.birthDate ? `${calculateAge(child.birthDate)}歳` : `${child.age || 0}歳`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-700">{finalPoints}pt</p>
                  <p className="text-xs text-orange-600">
                    基本 {selectedBasePoints}pt → 最終 {finalPoints}pt
                  </p>
                </div>
              </div>
              
              {appliedRules.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-orange-600 mb-2">適用されたレート:</p>
                  <div className="flex flex-wrap gap-2">
                    {appliedRules.map((ruleName, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs">
                        {ruleName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {activeRules.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">このお子様に適用されるレート設定はありません</p>
              )}
            </div>
          );
        })}
        
        {children.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">お子様が登録されていません</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface CreateRateModalProps {
  onClose: () => void;
  onSave: () => void;
  children: User[];
}

const getConditionsForType = (formData: any) => {
  if (formData.type === 'AGE_BASED') {
    return {
      minAge: formData.minAge ? parseInt(formData.minAge) : undefined,
      maxAge: formData.maxAge ? parseInt(formData.maxAge) : undefined
    };
  } else if (formData.type === 'PERIOD_BASED') {
    return {
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      taskCategory: formData.taskCategory || undefined
    };
  } else if (formData.type === 'PERFORMANCE_BASED') {
    return {
      completionCount: formData.completionCount ? parseInt(formData.completionCount) : undefined,
      taskCategory: formData.taskCategory || undefined
    };
  }
  return {};
};

const CreateRateModal: React.FC<CreateRateModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'AGE_BASED' as const,
    description: '',
    multiplier: 1.0,
    bonusPoints: 0,
    minAge: '',
    maxAge: '',
    startDate: '',
    endDate: '',
    taskCategory: '',
    completionCount: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const rates = storage.getRateRules();
    const newRate: RateRule = {
      id: storage.generateId(),
      name: formData.name,
      type: formData.type,
      description: formData.description,
      multiplier: formData.multiplier,
      bonusPoints: formData.bonusPoints > 0 ? formData.bonusPoints : undefined,
      conditions: getConditionsForType(formData),
      isActive: true,
      createdAt: new Date()
    };
    
    rates.push(newRate);
    storage.saveRateRules(rates);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 w-full max-w-2xl border-4 border-purple-300 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">
          ⚙️ 新しいレート設定を作成
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">📝 設定名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="例: 小学生ボーナス"
                required
              />
            </div>
            
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">⚙️ タイプ</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="input-field"
              >
                <option value="AGE_BASED">👶 年齢ベース</option>
                <option value="PERIOD_BASED">📅 期間ベース</option>
                <option value="PERFORMANCE_BASED">🏆 実績ベース</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-lg font-bold text-purple-700 mb-2">📋 説明</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="このレート設定の目的や適用条件を説明してください"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">✨ ポイント倍率</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1 })}
                className="input-field"
                required
              />
              <p className="text-xs text-purple-600 mt-1">基本ポイントにかける倍率 (例: 1.5 = 1.5倍)</p>
            </div>
            
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">🎁 ボーナスポイント</label>
              <input
                type="number"
                min="0"
                value={formData.bonusPoints}
                onChange={(e) => setFormData({ ...formData, bonusPoints: parseInt(e.target.value) || 0 })}
                className="input-field"
              />
              <p className="text-xs text-purple-600 mt-1">倍率適用後に追加するボーナス</p>
            </div>
          </div>

          {/* 条件設定 */}
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <h4 className="font-bold text-purple-700 mb-4">🎯 適用条件</h4>
            
            {formData.type === 'AGE_BASED' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">最小年齢</label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    value={formData.minAge}
                    onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                    className="input-field"
                    placeholder="例: 6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">最大年齢（任意）</label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    value={formData.maxAge}
                    onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                    className="input-field"
                    placeholder="例: 12"
                  />
                </div>
              </div>
            )}

            {formData.type === 'PERIOD_BASED' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">開始日</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">終了日</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">対象カテゴリ（任意）</label>
                  <select
                    value={formData.taskCategory}
                    onChange={(e) => setFormData({ ...formData, taskCategory: e.target.value })}
                    className="input-field"
                  >
                    <option value="">すべてのカテゴリ</option>
                    <option value="家事">家事</option>
                    <option value="勉強">勉強</option>
                    <option value="運動">運動</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>
            )}

            {formData.type === 'PERFORMANCE_BASED' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">必要完了回数</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.completionCount}
                    onChange={(e) => setFormData({ ...formData, completionCount: e.target.value })}
                    className="input-field"
                    placeholder="例: 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">対象カテゴリ（任意）</label>
                  <select
                    value={formData.taskCategory}
                    onChange={(e) => setFormData({ ...formData, taskCategory: e.target.value })}
                    className="input-field"
                  >
                    <option value="">すべてのカテゴリ</option>
                    <option value="家事">家事</option>
                    <option value="勉強">勉強</option>
                    <option value="運動">運動</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-lg px-8"
            >
              🔙 キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary text-lg flex items-center gap-3 px-8"
            >
              <Plus className="w-6 h-6" />
              ⚙️ 作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RateManagement;