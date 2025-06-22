import React, { useState, useEffect, Suspense } from 'react';
import { Task, TaskCompletion, User } from '../types';
import { database } from '../utils/database';
import { useAuth } from '../hooks/useAuth';
import { calculateAge } from '../utils/dateUtils';
import { Plus, CheckCircle, XCircle, Clock, Users, Award, Trash2, Calendar, BarChart3, Settings, Coins } from 'lucide-react';

// 重いコンポーネントをレイジーロード
const EventManagement = React.lazy(() => import('./EventManagement'));
const Statistics = React.lazy(() => import('./Statistics'));
const RateManagement = React.lazy(() => import('./RateManagement'));
const PointExchange = React.lazy(() => import('./PointExchange'));
const FamilyManagement = React.lazy(() => import('./FamilyManagement'));

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<TaskCompletion[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [childrenPoints, setChildrenPoints] = useState<{[childId: string]: number}>({});
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<'tasks' | 'events' | 'statistics' | 'rates' | 'exchange' | 'family'>('tasks');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // タブ切り替え時のデータ更新
  const handleTabChange = (newTab: 'tasks' | 'events' | 'statistics' | 'rates' | 'exchange' | 'family') => {
    setCurrentTab(newTab);
    // 家族管理タブから他のタブに移動する場合は、データを最新に更新
    if (currentTab === 'family' && newTab !== 'family') {
      loadData();
    }
  };

  useEffect(() => {
    if (user?.familyId) {
      loadData();
    }
  }, [user?.familyId]);

  const loadData = async () => {
    if (!user?.familyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Supabaseからデータを取得
      const [tasksData, completionsData, usersData, transactionsData] = await Promise.all([
        database.getTasks(user.familyId),
        database.getTaskCompletions(user.familyId),
        database.getUsers(user.familyId),
        database.getPointTransactions(user.familyId)
      ]);
      
      setTasks(tasksData);
      setPendingCompletions(completionsData.filter(completion => completion.status === 'PENDING'));
      const childrenData = usersData.filter(user => user.role === 'CHILD');
      setChildren(childrenData);
      
      // 子供のポイントを計算
      const pointsMap: {[childId: string]: number} = {};
      childrenData.forEach(child => {
        const childTransactions = transactionsData.filter(t => t.userId === child.id);
        const earnedPoints = childTransactions.filter(t => t.type === 'EARNED').reduce((sum, t) => sum + t.amount, 0);
        const spentPoints = childTransactions.filter(t => t.type === 'EXCHANGED').reduce((sum, t) => sum + t.amount, 0);
        pointsMap[child.id] = earnedPoints - spentPoints;
      });
      setChildrenPoints(pointsMap);
    } catch (err) {
      console.error('データ読み込みエラー:', err);
      setError('データベースの初期設定が必要です。Supabaseでdatabase-schema.sqlを実行してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (completionId: string, approved: boolean) => {
    if (!user?.familyId) return;
    
    try {
      const completion = pendingCompletions.find(c => c.id === completionId);
      if (!completion) return;

      // タスク完了ステータスを更新
      await database.updateTaskCompletion(completionId, {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedAt: new Date()
      });

      // 承認された場合はポイントを付与
      if (approved) {
        const task = tasks.find(t => t.id === completion.taskId);
        if (task) {
          await database.createPointTransaction({
            userId: completion.childId,
            type: 'EARNED',
            amount: task.points,
            description: `タスク完了: ${task.title}`,
            createdAt: new Date()
          }, user.familyId);
        }
      }
      
      // データを再読み込み
      await loadData();
    } catch (err) {
      console.error('承認処理エラー:', err);
      setError('承認処理に失敗しました');
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


  const canDeleteTask = (taskId: string) => {
    // タスクが子供によって実行されていない場合のみ削除可能
    const hasCompletions = pendingCompletions.some(c => c.taskId === taskId);
    return !hasCompletions;
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user?.familyId) return;
    
    if (canDeleteTask(taskId)) {
      if (confirm('このタスクを削除してもよろしいですか？')) {
        try {
          await database.deleteTask(taskId);
          await loadData();
        } catch (err) {
          console.error('タスク削除エラー:', err);
          setError('タスクの削除に失敗しました');
        }
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
    // 現在ロードされているpendingCompletionsから確認
    const taskCompletions = pendingCompletions.filter(c => c.taskId === taskId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-600 text-lg font-medium">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={loadData}
          className="btn-primary"
        >
          再読み込み
        </button>
      </div>
    );
  }

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

      {/* メインタブ - モバイル最適化 */}
      <div className="mb-6">
        {/* モバイル用: ドロップダウンメニュー */}
        <div className="md:hidden">
          <select
            value={currentTab}
            onChange={(e) => handleTabChange(e.target.value as any)}
            className="w-full p-4 bg-white border-2 border-purple-300 rounded-2xl font-bold text-purple-800 text-lg shadow-lg focus:ring-4 focus:ring-purple-200 focus:border-purple-500"
          >
            <option value="tasks">🎯 クエスト管理</option>
            <option value="events">🎉 イベント管理</option>
            <option value="statistics">📊 統計・レポート</option>
            <option value="rates">⚙️ レート設定</option>
            <option value="exchange">💰 ポイント交換</option>
            <option value="family">👨‍👩‍👧‍👦 家族管理</option>
          </select>
        </div>

        {/* デスクトップ用: 横並びボタン */}
        <div className="hidden md:flex gap-2 lg:gap-4 flex-wrap">
          <button
            onClick={() => handleTabChange('tasks')}
            className={`px-4 lg:px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 text-sm lg:text-base ${
              currentTab === 'tasks'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Award className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden lg:inline">🎯 クエスト管理</span>
            <span className="lg:hidden">🎯 クエスト</span>
          </button>
          <button
            onClick={() => handleTabChange('events')}
            className={`px-4 lg:px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 text-sm lg:text-base ${
              currentTab === 'events'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden lg:inline">🎉 イベント管理</span>
            <span className="lg:hidden">🎉 イベント</span>
          </button>
          <button
            onClick={() => handleTabChange('statistics')}
            className={`px-4 lg:px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 text-sm lg:text-base ${
              currentTab === 'statistics'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden lg:inline">📊 統計・レポート</span>
            <span className="lg:hidden">📊 統計</span>
          </button>
          <button
            onClick={() => handleTabChange('rates')}
            className={`px-4 lg:px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 text-sm lg:text-base ${
              currentTab === 'rates'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden lg:inline">⚙️ レート設定</span>
            <span className="lg:hidden">⚙️ レート</span>
          </button>
          <button
            onClick={() => handleTabChange('exchange')}
            className={`px-4 lg:px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 text-sm lg:text-base ${
              currentTab === 'exchange'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Coins className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden lg:inline">💰 ポイント交換</span>
            <span className="lg:hidden">💰 ポイント</span>
          </button>
          <button
            onClick={() => handleTabChange('family')}
            className={`px-4 lg:px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 text-sm lg:text-base ${
              currentTab === 'family'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Users className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden lg:inline">👨‍👩‍👧‍👦 家族管理</span>
            <span className="lg:hidden">👨‍👩‍👧‍👦 家族</span>
          </button>
        </div>
      </div>

      {/* タブ内容 */}
      {currentTab === 'events' ? (
        <Suspense fallback={<div className="text-center py-8">イベント管理を読み込み中...</div>}>
          <EventManagement children={children} />
        </Suspense>
      ) : currentTab === 'statistics' ? (
        <Suspense fallback={<div className="text-center py-8">統計データを読み込み中...</div>}>
          <Statistics children={children} />
        </Suspense>
      ) : currentTab === 'rates' ? (
        <Suspense fallback={<div className="text-center py-8">レート設定を読み込み中...</div>}>
          <RateManagement />
        </Suspense>
      ) : currentTab === 'exchange' ? (
        <Suspense fallback={<div className="text-center py-8">ポイント交換を読み込み中...</div>}>
          <PointExchange children={children} />
        </Suspense>
      ) : currentTab === 'family' ? (
        <Suspense fallback={<div className="text-center py-8">家族管理を読み込み中...</div>}>
          <FamilyManagement onDataUpdate={loadData} />
        </Suspense>
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
                  <p className="font-bold text-2xl text-purple-600">{childrenPoints[child.id] || 0}pt</p>
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
        
        {/* タブナビゲーション - モバイル最適化 */}
        <div className="mb-6">
          {/* モバイル用: セレクトボックス */}
          <div className="md:hidden">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full p-3 bg-white border-2 border-purple-300 rounded-xl font-medium text-purple-800 shadow-md"
            >
              <option value="all">👨‍👩‍👧‍👦 全体表示</option>
              <option value="general">👥 全員対象</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}さん
                </option>
              ))}
            </select>
          </div>

          {/* タブレット・デスクトップ用: ボタン */}
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedChildId('all')}
              className={`px-3 lg:px-4 py-2 rounded-full font-medium transition-all text-sm lg:text-base ${
                selectedChildId === 'all'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👨‍👩‍👧‍👦 全体表示
            </button>
            <button
              onClick={() => setSelectedChildId('general')}
              className={`px-3 lg:px-4 py-2 rounded-full font-medium transition-all text-sm lg:text-base ${
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
                className={`px-3 lg:px-4 py-2 rounded-full font-medium transition-all text-sm lg:text-base ${
                  selectedChildId === child.id
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {child.name}さん
              </button>
            ))}
          </div>
        </div>

        {/* タスク表示エリア - モバイル最適化 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* 実行前タスク */}
          <div>
            <h4 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2">
              🎯 実行前クエスト ({notExecuted.length}件)
            </h4>
            <div className="space-y-3">
              {notExecuted.map(task => {
                const assignedChild = task.assignedTo ? children.find(c => c.id === task.assignedTo) : null;
                return (
                  <div key={task.id} className="p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold text-blue-800 text-sm lg:text-base leading-tight">{task.title}</h5>
                      <span className="text-sm lg:text-lg font-bold text-purple-600 bg-white px-2 lg:px-3 py-1 rounded-full border-2 border-purple-300 whitespace-nowrap ml-2">
                        {task.points}pt
                      </span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 lg:px-3 py-1 bg-blue-200 text-blue-700 rounded-full">{task.category}</span>
                      <span className="text-xs px-2 lg:px-3 py-1 bg-purple-200 text-purple-700 rounded-full">
                        {assignedChild ? assignedChild.name : '全員'}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-blue-700 mb-3 leading-relaxed">{task.description}</p>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors touch-manipulation"
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
                  <div key={task.id} className="p-3 lg:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold text-green-800 text-sm lg:text-base leading-tight">{task.title}</h5>
                      <span className="text-sm lg:text-lg font-bold text-purple-600 bg-white px-2 lg:px-3 py-1 rounded-full border-2 border-purple-300 whitespace-nowrap ml-2">
                        {task.points}pt
                      </span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 lg:px-3 py-1 bg-green-200 text-green-700 rounded-full">{task.category}</span>
                      <span className="text-xs px-2 lg:px-3 py-1 bg-purple-200 text-purple-700 rounded-full">
                        {assignedChild ? assignedChild.name : '全員'}
                      </span>
                      <span className="text-xs px-2 lg:px-3 py-1 bg-emerald-200 text-emerald-700 rounded-full">
                        {completions.length}回実行
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-green-700 leading-relaxed">{task.description}</p>
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
            <CreateTaskModal 
              onClose={() => setShowCreateTask(false)} 
              onSave={loadData}
              user={user}
              children={children}
            />
          )}
        </>
      )}
    </div>
  );
};

interface CreateTaskModalProps {
  onClose: () => void;
  onSave: () => void;
  user: any;
  children: User[];
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onSave, user, children }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 10,
    category: '家事',
    difficulty: 'EASY' as const,
    isRecurring: false,
    assignedTo: '' // 空文字は「全員」を意味する
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.familyId) return;
    
    try {
      await database.createTask({
        ...formData,
        assignedTo: formData.assignedTo || undefined,
        createdBy: user.id
      }, user.familyId);
      
      onSave();
      onClose();
    } catch (err) {
      console.error('タスク作成エラー:', err);
      alert('タスクの作成に失敗しました');
    }
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