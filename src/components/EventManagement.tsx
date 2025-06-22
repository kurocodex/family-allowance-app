import React, { useState, useEffect } from 'react';
import { Event, EventResult, User } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';
import { calculateAge } from '../utils/dateUtils';
import { Calendar, Trophy, Plus, Star, CheckCircle } from 'lucide-react';

interface EventManagementProps {
  children: User[];
}

const EventManagement: React.FC<EventManagementProps> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventResults, setEventResults] = useState<EventResult[]>([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEvents(storage.getEvents());
    setEventResults(storage.getEventResults());
  };

  const activeEvents = events.filter(event => {
    if (!event.dueDate) return true;
    return new Date(event.dueDate) >= new Date();
  });

  const completedEvents = events.filter(event => {
    if (!event.dueDate) return false;
    return new Date(event.dueDate) < new Date();
  });

  const getEventResults = (eventId: string) => {
    return eventResults.filter(result => result.eventId === eventId);
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || '不明';
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-purple-800">🎉 イベント管理</h2>
        {user?.role === 'PARENT' && (
          <button
            onClick={() => setShowCreateEvent(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            ✨ 新しいイベント
          </button>
        )}
      </div>

      {/* タブ切り替え */}
      <div className="card">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              selectedTab === 'active'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔥 アクティブイベント ({activeEvents.length})
          </button>
          <button
            onClick={() => setSelectedTab('completed')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              selectedTab === 'completed'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ✅ 完了イベント ({completedEvents.length})
          </button>
        </div>

        {/* イベント一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(selectedTab === 'active' ? activeEvents : completedEvents).map(event => (
            <EventCard
              key={event.id}
              event={event}
              results={getEventResults(event.id)}
              children={children}
              getChildName={getChildName}
              onUpdate={loadData}
            />
          ))}
          {(selectedTab === 'active' ? activeEvents : completedEvents).length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-purple-600 text-lg">
                {selectedTab === 'active' 
                  ? '🎯 アクティブなイベントはありません' 
                  : '📅 完了したイベントはありません'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {showCreateEvent && (
        <CreateEventModal 
          onClose={() => setShowCreateEvent(false)} 
          onSave={loadData}
          children={children}
        />
      )}
    </div>
  );
};

interface EventCardProps {
  event: Event;
  results: EventResult[];
  children: User[];
  getChildName: (childId: string) => string;
  onUpdate: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, results, children, getChildName, onUpdate }) => {
  const { user } = useAuth();
  const [showResultModal, setShowResultModal] = useState(false);

  const assignedChild = event.assignedTo ? children.find(c => c.id === event.assignedTo) : null;
  const isExpired = event.dueDate && new Date(event.dueDate) < new Date();
  const myResult = results.find(r => r.childId === user?.id);
  const canSubmit = user?.role === 'CHILD' && (!event.assignedTo || event.assignedTo === user.id) && !myResult && !isExpired;

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'SCORE_BASED': return '📊';
      case 'EVALUATION_BASED': return '⭐';
      case 'COMPLETION_BASED': return '✅';
      default: return '🎯';
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'SCORE_BASED': return '点数ベース';
      case 'EVALUATION_BASED': return '評価ベース';
      case 'COMPLETION_BASED': return '完了ベース';
      default: return type;
    }
  };

  return (
    <div className={`p-6 rounded-2xl border-2 shadow-lg transition-all hover:shadow-xl ${
      isExpired 
        ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
        : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-orange-800">{event.title}</h3>
          <p className="text-sm text-orange-600 font-medium">{event.category}</p>
        </div>
        <div className="text-2xl">{getEventTypeIcon(event.eventType)}</div>
      </div>

      <p className="text-sm text-orange-700 mb-4">{event.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 bg-orange-200 text-orange-700 rounded-full">
            {getEventTypeText(event.eventType)}
          </span>
          <span className="text-xs px-3 py-1 bg-purple-200 text-purple-700 rounded-full">
            {assignedChild ? assignedChild.name : '全員'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <Trophy className="w-4 h-4" />
          <span>
            {event.pointsConfig.basePoints}pt ～ {event.pointsConfig.maxPoints}pt
            {event.pointsConfig.bonusPoints && ` (+${event.pointsConfig.bonusPoints}pt ボーナス)`}
          </span>
        </div>

        {event.dueDate && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Calendar className="w-4 h-4" />
            <span>期限: {new Date(event.dueDate).toLocaleDateString('ja-JP')}</span>
            {isExpired && <span className="text-red-500 font-bold">（期限切れ）</span>}
          </div>
        )}
      </div>

      {/* 結果表示 */}
      {results.length > 0 && (
        <div className="mb-4">
          <h4 className="font-bold text-sm text-orange-800 mb-2">📝 結果</h4>
          <div className="space-y-2">
            {results.map(result => (
              <div key={result.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-orange-200">
                <div>
                  <span className="font-medium text-sm">{getChildName(result.childId)}</span>
                  <div className="text-xs text-gray-600">
                    {result.resultType === 'SCORE' && `${result.score}点`}
                    {result.resultType === 'EVALUATION' && result.evaluation}
                    {result.resultType === 'COMPLETED' && '完了'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-purple-600">{result.earnedPoints}pt</span>
                  {result.bonusEarned && <span className="text-xs text-green-600 block">ボーナス獲得！</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      {canSubmit && (
        <button
          onClick={() => setShowResultModal(true)}
          className="w-full btn-primary text-sm flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          🚀 結果を報告
        </button>
      )}

      {myResult && (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">
            結果報告済み ({myResult.earnedPoints}pt獲得)
          </span>
        </div>
      )}

      {showResultModal && (
        <EventResultModal
          event={event}
          onClose={() => setShowResultModal(false)}
          onSave={onUpdate}
        />
      )}
    </div>
  );
};

interface CreateEventModalProps {
  onClose: () => void;
  onSave: () => void;
  children: User[];
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onSave, children }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'テスト',
    eventType: 'SCORE_BASED' as const,
    assignedTo: '',
    basePoints: 10,
    maxPoints: 50,
    bonusPoints: 10,
    targetScore: 80,
    dueDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const events = storage.getEvents();
    const newEvent: Event = {
      id: storage.generateId(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      eventType: formData.eventType,
      pointsConfig: {
        basePoints: formData.basePoints,
        maxPoints: formData.maxPoints,
        bonusPoints: formData.bonusPoints,
        targetScore: formData.targetScore,
        // 点数ベースのデフォルト設定
        scoreThresholds: formData.eventType === 'SCORE_BASED' ? [
          { score: 90, points: formData.maxPoints },
          { score: 80, points: Math.floor(formData.maxPoints * 0.8) },
          { score: 70, points: Math.floor(formData.maxPoints * 0.6) },
          { score: 60, points: Math.floor(formData.maxPoints * 0.4) },
          { score: 0, points: formData.basePoints }
        ] : undefined
      },
      assignedTo: formData.assignedTo || undefined,
      createdBy: storage.getCurrentUser()?.id || '',
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      createdAt: new Date()
    };
    
    events.push(newEvent);
    storage.saveEvents(events);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 w-full max-w-2xl border-4 border-purple-300 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">
          🎉 新しいイベントを作成
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">
                📝 イベント名
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="例: 算数のテスト"
                required
              />
            </div>
            
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">
                🏷️ カテゴリ
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                <option value="テスト">テスト</option>
                <option value="発表会">発表会</option>
                <option value="コンクール">コンクール</option>
                <option value="習い事">習い事</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-lg font-bold text-purple-700 mb-2">
              📋 説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="イベントの詳細を説明してください"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">
                ⚙️ イベントタイプ
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                className="input-field"
              >
                <option value="SCORE_BASED">📊 点数ベース（テスト等）</option>
                <option value="EVALUATION_BASED">⭐ 評価ベース（発表会等）</option>
                <option value="COMPLETION_BASED">✅ 完了ベース</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">
                👧 対象
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="input-field"
              >
                <option value="">全員</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name} ({child.birthDate ? `${calculateAge(child.birthDate)}歳` : `${child.age || 0}歳`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-purple-700 mb-2">
                💎 基本ポイント
              </label>
              <input
                type="number"
                value={formData.basePoints}
                onChange={(e) => setFormData({ ...formData, basePoints: parseInt(e.target.value) })}
                className="input-field"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-purple-700 mb-2">
                ✨ 最大ポイント
              </label>
              <input
                type="number"
                value={formData.maxPoints}
                onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) })}
                className="input-field"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-purple-700 mb-2">
                🎁 ボーナス
              </label>
              <input
                type="number"
                value={formData.bonusPoints}
                onChange={(e) => setFormData({ ...formData, bonusPoints: parseInt(e.target.value) })}
                className="input-field"
                min="0"
              />
            </div>

            {formData.eventType === 'SCORE_BASED' && (
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-2">
                  🎯 目標点数
                </label>
                <input
                  type="number"
                  value={formData.targetScore}
                  onChange={(e) => setFormData({ ...formData, targetScore: parseInt(e.target.value) })}
                  className="input-field"
                  min="0"
                  max="100"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-lg font-bold text-purple-700 mb-2">
              📅 期限（任意）
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input-field"
            />
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
              🎉 作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EventResultModalProps {
  event: Event;
  onClose: () => void;
  onSave: () => void;
}

const EventResultModal: React.FC<EventResultModalProps> = ({ event, onClose, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    score: 0,
    evaluation: '',
    comments: ''
  });

  const calculatePoints = () => {
    const { pointsConfig } = event;
    let earnedPoints = pointsConfig.basePoints;
    let bonusEarned = false;

    if (event.eventType === 'SCORE_BASED' && pointsConfig.scoreThresholds) {
      for (const threshold of pointsConfig.scoreThresholds) {
        if (formData.score >= threshold.score) {
          earnedPoints = threshold.points;
          break;
        }
      }
      
      if (pointsConfig.targetScore && formData.score >= pointsConfig.targetScore && pointsConfig.bonusPoints) {
        earnedPoints += pointsConfig.bonusPoints;
        bonusEarned = true;
      }
    } else if (event.eventType === 'COMPLETION_BASED') {
      earnedPoints = pointsConfig.maxPoints;
      if (pointsConfig.bonusPoints) {
        earnedPoints += pointsConfig.bonusPoints;
        bonusEarned = true;
      }
    }

    return { earnedPoints, bonusEarned };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { earnedPoints, bonusEarned } = calculatePoints();
    
    const eventResults = storage.getEventResults();
    const newResult: EventResult = {
      id: storage.generateId(),
      eventId: event.id,
      childId: user.id,
      resultType: event.eventType === 'SCORE_BASED' ? 'SCORE' : 
                 event.eventType === 'EVALUATION_BASED' ? 'EVALUATION' : 'COMPLETED',
      score: event.eventType === 'SCORE_BASED' ? formData.score : undefined,
      evaluation: event.eventType === 'EVALUATION_BASED' ? formData.evaluation : undefined,
      earnedPoints,
      bonusEarned,
      submittedAt: new Date(),
      status: 'PENDING',
      comments: formData.comments
    };
    
    eventResults.push(newResult);
    storage.saveEventResults(eventResults);
    onSave();
    onClose();
  };

  const { earnedPoints, bonusEarned } = calculatePoints();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 w-full max-w-md border-4 border-purple-300 shadow-2xl">
        <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">
          📝 結果を報告
        </h3>
        
        <div className="mb-6 p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-300">
          <h4 className="font-bold text-orange-800">{event.title}</h4>
          <p className="text-sm text-orange-600 mt-1">{event.description}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {event.eventType === 'SCORE_BASED' && (
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">
                📊 点数
              </label>
              <input
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                className="input-field text-center text-2xl"
                min="0"
                max="100"
                placeholder="点数を入力"
                required
              />
            </div>
          )}

          {event.eventType === 'EVALUATION_BASED' && (
            <div>
              <label className="block text-lg font-bold text-purple-700 mb-2">
                ⭐ 評価
              </label>
              <select
                value={formData.evaluation}
                onChange={(e) => setFormData({ ...formData, evaluation: e.target.value })}
                className="input-field"
                required
              >
                <option value="">評価を選択</option>
                <option value="とてもよくできました">とてもよくできました</option>
                <option value="よくできました">よくできました</option>
                <option value="できました">できました</option>
                <option value="がんばりましょう">がんばりましょう</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-lg font-bold text-purple-700 mb-2">
              💭 コメント（任意）
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="がんばったことや感想を書いてね"
            />
          </div>

          {/* 獲得予定ポイント表示 */}
          <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border-2 border-green-300">
            <h4 className="font-bold text-green-800 mb-2">🎉 獲得予定ポイント</h4>
            <div className="text-3xl font-bold text-green-600 text-center">
              {earnedPoints}pt
              {bonusEarned && <span className="text-lg text-yellow-600 block">+ ボーナス獲得！</span>}
            </div>
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
              <CheckCircle className="w-6 h-6" />
              📤 送信
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventManagement;