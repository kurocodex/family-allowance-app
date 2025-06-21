import React, { useState, useEffect } from 'react';
import { Task, TaskCompletion, PointTransaction, User } from '../types';
import { storage } from '../utils/storage';
import { calculateAge } from '../utils/dateUtils';
import { Plus, CheckCircle, XCircle, Clock, Users, Award, Trash2, Calendar, BarChart3, Settings, Coins } from 'lucide-react';
import EventManagement from './EventManagement';
import Statistics from './Statistics';
import RateManagement from './RateManagement';
import PointExchange from './PointExchange';
import FamilyManagement from './FamilyManagement';

const ParentDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<TaskCompletion[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<'tasks' | 'events' | 'statistics' | 'rates' | 'exchange' | 'family'>('tasks');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTasks(storage.getTasks());
    setPendingCompletions(
      storage.getTaskCompletions().filter(completion => completion.status === 'PENDING')
    );
    setChildren(storage.getUsers().filter(user => user.role === 'CHILD'));
  };

  const handleApproval = (completionId: string, approved: boolean) => {
    const completions = storage.getTaskCompletions();
    const completion = completions.find(c => c.id === completionId);
    
    if (completion) {
      completion.status = approved ? 'APPROVED' : 'REJECTED';
      completion.approvedAt = new Date();
      
      if (approved) {
        const task = tasks.find(t => t.id === completion.taskId);
        if (task) {
          const transactions = storage.getPointTransactions();
          const newTransaction: PointTransaction = {
            id: storage.generateId(),
            userId: completion.childId,
            type: 'EARNED',
            amount: task.points,
            description: `タスク完了: ${task.title}`,
            createdAt: new Date()
          };
          transactions.push(newTransaction);
          storage.savePointTransactions(transactions);
        }
      }
      
      storage.saveTaskCompletions(completions);
      loadData();
    }
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || '不明';
  };

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || '不明なタスク';
  };

  const getChildPoints = (childId: string) => {
    const transactions = storage.getPointTransactions().filter(t => t.userId === childId);
    return transactions.reduce((total, t) => {
      return t.type === 'EARNED' ? total + t.amount : total - t.amount;
    }, 0);
  };

  const canDeleteTask = (taskId: string) => {
    // タスクが子供によって実行されていない場合のみ削除可能
    const completions = storage.getTaskCompletions();
    const hasCompletions = completions.some(c => c.taskId === taskId);
    return !hasCompletions;
  };

  const handleDeleteTask = (taskId: string) => {
    if (canDeleteTask(taskId)) {
      if (confirm('このタスクを削除してもよろしいですか？')) {
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        storage.saveTasks(updatedTasks);
        loadData();
      }
    } else {
      alert('子供が実行済みのタスクは削除できません。');
    }
  };

  // 子供別のタスクを取得する関数
  const getTasksForChild = (childId: string) => {
    return tasks.filter(task => task.assignedTo === childId);
  };

  // 全員対象のタスクを取得
  const getGeneralTasks = () => {
    return tasks.filter(task => !task.assignedTo);
  };

  // タスクの実行状況を取得
  const getTaskExecutionStatus = (taskId: string) => {
    const completions = storage.getTaskCompletions();
    const taskCompletions = completions.filter(c => c.taskId === taskId);
    return taskCompletions;
  };

  // 実行前タスクと実行済みタスクを分離
  const separateTasksByExecution = (taskList: Task[]) => {
    const notExecuted: Task[] = [];
    const executed: Task[] = [];

    taskList.forEach(task => {
      const completions = getTaskExecutionStatus(task.id);
      if (completions.length === 0) {
        notExecuted.push(task);
      } else {
        executed.push(task);
      }
    });

    return { notExecuted, executed };
  };

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId('all'); // デフォルトは「全体表示」
    }
  }, [children, selectedChildId]);

  // 表示するタスクを決定
  const getDisplayTasks = () => {
    if (selectedChildId === 'all') {
      return tasks;
    } else if (selectedChildId === 'general') {
      return getGeneralTasks();
    } else {
      return getTasksForChild(selectedChildId);
    }
  };

  const displayTasks = getDisplayTasks();
  const { notExecuted, executed } = separateTasksByExecution(displayTasks);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-purple-800">👨‍👩‍👧‍👦 保護者ダッシュボード</h2>
        {currentTab === 'tasks' && (
          <button
            onClick={() => setShowCreateTask(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            ✨ 新しいクエスト
          </button>
        )}
      </div>

      {/* メインタブ */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setCurrentTab('tasks')}
          className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
            currentTab === 'tasks'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Award className="w-5 h-5" />
          🎯 クエスト管理
        </button>
        <button
          onClick={() => setCurrentTab('events')}
          className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
            currentTab === 'events'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Calendar className="w-5 h-5" />
          🎉 イベント管理
        </button>
        <button
          onClick={() => setCurrentTab('statistics')}
          className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
            currentTab === 'statistics'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          📊 統計・レポート
        </button>
        <button
          onClick={() => setCurrentTab('rates')}
          className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
            currentTab === 'rates'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Settings className="w-5 h-5" />
          ⚙️ レート設定
        </button>
        <button
          onClick={() => setCurrentTab('exchange')}
          className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
            currentTab === 'exchange'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Coins className="w-5 h-5" />
          💰 ポイント交換
        </button>
        <button
          onClick={() => setCurrentTab('family')}
          className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
            currentTab === 'family'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Users className="w-5 h-5" />
          👨‍👩‍👧‍👦 家族管理
        </button>
      </div>

      {/* タブ内容 */}
      {currentTab === 'events' ? (
        <EventManagement />
      ) : currentTab === 'statistics' ? (
        <Statistics />
      ) : currentTab === 'rates' ? (
        <RateManagement />
      ) : currentTab === 'exchange' ? (
        <PointExchange />
      ) : currentTab === 'family' ? (
        <React.Suspense fallback={<div className="text-center py-8">家族管理を読み込み中...</div>}>
          <FamilyManagement />
        </React.Suspense>
      ) : (
        <>
          {/* お子様の状況と承認待ち */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* お子様の状況 */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-purple-500" />
            <h3 className="text-xl font-bold text-purple-700">👧 お子様の状況</h3>
          </div>
          <div className="space-y-3">
            {children.map(child => (
              <div key={child.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border-2 border-pink-200">
                <div>
                  <p className="font-bold text-purple-800">{child.name}</p>
                  <p className="text-sm text-purple-600">
                    {child.birthDate ? `${calculateAge(child.birthDate)}歳` : `${child.age || 0}歳`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-2xl text-purple-600">{getChildPoints(child.id)}pt</p>
                  <p className="text-xs text-purple-500">保有ポイント</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 承認待ち */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
            <h3 className="text-xl font-bold text-yellow-700">⏰ 承認待ち</h3>
          </div>
          <div className="space-y-3">
            {pendingCompletions.slice(0, 4).map(completion => (
              <div key={completion.id} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300">
                <p className="font-bold text-orange-800 mb-1">{getTaskTitle(completion.taskId)}</p>
                <p className="text-sm text-orange-600 mb-3">{getChildName(completion.childId)}さん</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApproval(completion.id, true)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-full flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    ✅ 承認
                  </button>
                  <button
                    onClick={() => handleApproval(completion.id, false)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-full flex items-center justify-center gap-2 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    ❌ 却下
                  </button>
                </div>
              </div>
            ))}
            {pendingCompletions.length === 0 && (
              <div className="text-center py-6">
                <p className="text-yellow-600">📝 承認待ちのクエストはありません</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 子供選択タブ */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-8 h-8 text-green-500" />
          <h3 className="text-xl font-bold text-green-700">🎯 クエスト管理</h3>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedChildId('all')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedChildId === 'all'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👨‍👩‍👧‍👦 全体表示
          </button>
          <button
            onClick={() => setSelectedChildId('general')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedChildId === 'general'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👥 全員対象
          </button>
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedChildId === child.id
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {child.name}さん
            </button>
          ))}
        </div>

        {/* タスク表示エリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 実行前タスク */}
          <div>
            <h4 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2">
              🎯 実行前クエスト ({notExecuted.length}件)
            </h4>
            <div className="space-y-3">
              {notExecuted.map(task => {
                const assignedChild = task.assignedTo ? children.find(c => c.id === task.assignedTo) : null;
                return (
                  <div key={task.id} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold text-blue-800">{task.title}</h5>
                      <span className="text-lg font-bold text-purple-600 bg-white px-3 py-1 rounded-full border-2 border-purple-300">
                        {task.points}pt
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-3 py-1 bg-blue-200 text-blue-700 rounded-full">{task.category}</span>
                      <span className="text-xs px-3 py-1 bg-purple-200 text-purple-700 rounded-full">
                        {assignedChild ? assignedChild.name : '全員'}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">{task.description}</p>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        title="クエストを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {notExecuted.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-blue-600">🎉 実行前のクエストはありません</p>
                </div>
              )}
            </div>
          </div>

          {/* 実行済みタスク */}
          <div>
            <h4 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
              ✅ 実行済みクエスト ({executed.length}件)
            </h4>
            <div className="space-y-3">
              {executed.map(task => {
                const assignedChild = task.assignedTo ? children.find(c => c.id === task.assignedTo) : null;
                const completions = getTaskExecutionStatus(task.id);
                return (
                  <div key={task.id} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold text-green-800">{task.title}</h5>
                      <span className="text-lg font-bold text-purple-600 bg-white px-3 py-1 rounded-full border-2 border-purple-300">
                        {task.points}pt
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-3 py-1 bg-green-200 text-green-700 rounded-full">{task.category}</span>
                      <span className="text-xs px-3 py-1 bg-purple-200 text-purple-700 rounded-full">
                        {assignedChild ? assignedChild.name : '全員'}
                      </span>
                      <span className="text-xs px-3 py-1 bg-emerald-200 text-emerald-700 rounded-full">
                        {completions.length}回実行
                      </span>
                    </div>
                    <p className="text-sm text-green-700">{task.description}</p>
                  </div>
                );
              })}
              {executed.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-green-600">📝 実行済みのクエストはありません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

          {showCreateTask && (
            <CreateTaskModal onClose={() => setShowCreateTask(false)} onSave={loadData} />
          )}
        </>
      )}
    </div>
  );
};

interface CreateTaskModalProps {
  onClose: () => void;
  onSave: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 10,
    category: '家事',
    difficulty: 'EASY' as const,
    isRecurring: false,
    assignedTo: '' // 空文字は「全員」を意味する
  });

  const children = storage.getUsers().filter(user => user.role === 'CHILD');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tasks = storage.getTasks();
    const newTask: Task = {
      id: storage.generateId(),
      ...formData,
      assignedTo: formData.assignedTo || undefined,
      createdBy: storage.getCurrentUser()?.id || '',
      createdAt: new Date()
    };
    
    tasks.push(newTask);
    storage.saveTasks(tasks);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">新しいタスクを作成</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タスク名
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              対象のお子様
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ポイント
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                className="input-field"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                <option value="家事">家事</option>
                <option value="勉強">勉強</option>
                <option value="運動">運動</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
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

export default ParentDashboard;