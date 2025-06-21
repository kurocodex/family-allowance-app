import React, { useState, useEffect } from 'react';
import { Task, TaskCompletion, Event } from '../types';
import { database } from '../utils/database';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, Clock, Star, Award, Send, Calendar, BarChart3 } from 'lucide-react';
import EventManagement from './EventManagement';

const ChildDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myCompletions, setMyCompletions] = useState<TaskCompletion[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentTab, setCurrentTab] = useState<'tasks' | 'events' | 'stats'>('tasks');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const [tasksData, completionsData, transactionsData] = await Promise.all([
        database.getTasks(user.familyId),
        database.getTaskCompletions(user.familyId),
        database.getPointTransactions(user.familyId)
      ]);
      
      setTasks(tasksData);
      setMyCompletions(completionsData.filter(c => c.childId === user.id));
      
      // ポイント計算
      const myTransactions = transactionsData.filter(t => t.userId === user.id);
      const earnedPoints = myTransactions.filter(t => t.type === 'EARNED').reduce((sum, t) => sum + t.amount, 0);
      const spentPoints = myTransactions.filter(t => t.type === 'EXCHANGED').reduce((sum, t) => sum + t.amount, 0);
      const currentBalance = earnedPoints - spentPoints;
      setMyPoints(currentBalance);
    } catch (err) {
      console.error('データ読み込みエラー:', err);
      setError('データベースの初期設定が必要です。Supabaseでdatabase-schema.sqlを実行してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (taskId: string, comments: string) => {
    if (!user?.familyId) return;
    
    try {
      await database.createTaskCompletion({
        taskId,
        childId: user.id,
        status: 'PENDING',
        submittedAt: new Date(),
        comments
      }, user.familyId);
      
      await loadData();
      setSelectedTask(null);
    } catch (err) {
      console.error('タスク提出エラー:', err);
      setError('タスクの提出に失敗しました');
    }
  };

  const getTaskStatus = (taskId: string) => {
    const completion = myCompletions.find(c => c.taskId === taskId);
    return completion?.status || null;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'かんたん';
      case 'MEDIUM': return 'ふつう';
      case 'HARD': return 'むずかしい';
      default: return difficulty;
    }
  };

  const availableTasks = tasks.filter(task => {
    const status = getTaskStatus(task.id);
    const isAssignedToMe = !task.assignedTo || task.assignedTo === user?.id;
    return isAssignedToMe && (!status || status === 'REJECTED');
  });

  const pendingTasks = tasks.filter(task => {
    const status = getTaskStatus(task.id);
    const isAssignedToMe = !task.assignedTo || task.assignedTo === user?.id;
    return isAssignedToMe && status === 'PENDING';
  });
  
  const completedTasks = tasks.filter(task => {
    const status = getTaskStatus(task.id);
    const isAssignedToMe = !task.assignedTo || task.assignedTo === user?.id;
    return isAssignedToMe && status === 'APPROVED';
  });

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
      <div className="text-center">
        <h2 className="text-3xl font-bold text-purple-800 mb-4">
          🌟 こんにちは、{user?.name}さん！
        </h2>
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-200 to-orange-200 text-orange-800 px-6 py-4 rounded-full shadow-lg border-2 border-yellow-300">
          <Award className="w-8 h-8 animate-pulse" />
          <span className="font-bold text-2xl">{myPoints} ✨ポイント</span>
        </div>
        <p className="text-purple-500 text-sm mt-1">💰 あなたの残高ポイントです</p>
        <p className="text-purple-600 mt-3 text-lg">🎮 クエストをクリアしてポイントをゲットしよう！</p>
      </div>

      {/* タブ切り替え */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setCurrentTab('tasks')}
          className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
            currentTab === 'tasks'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Star className="w-5 h-5" />
          🎯 クエスト
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
          🎉 イベント
        </button>
        <button
          onClick={() => setCurrentTab('stats')}
          className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
            currentTab === 'stats'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          📊 せいせき
        </button>
      </div>

      {/* タブ内容 */}
      {currentTab === 'events' ? (
        <EventManagement />
      ) : currentTab === 'stats' ? (
        <ChildStatsView 
          user={user}
          tasks={tasks}
          completions={myCompletions}
          totalPoints={myPoints}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-cute">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-8 h-8 text-yellow-500 animate-spin" />
              <h3 className="text-xl font-bold text-purple-700">🎯 クエスト一覧</h3>
            </div>
            <div className="space-y-4">
              {availableTasks.map(task => (
                <div key={task.id} className="quest-card">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-orange-800">{task.title}</h4>
                    <span className="font-bold text-purple-600 text-lg bg-white px-3 py-1 rounded-full border-2 border-purple-300">
                      {task.points}pt 💎
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(task.difficulty)}`}>
                      {getDifficultyText(task.difficulty)}
                    </span>
                    <span className="text-xs text-orange-700 bg-orange-200 px-2 py-1 rounded-full">{task.category}</span>
                  </div>
                  <p className="text-sm text-orange-800 mb-4 font-medium">{task.description}</p>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    🚀 チャレンジ！
                  </button>
                </div>
              ))}
              {availableTasks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-purple-600 text-lg">🎉 すべてのクエストクリア！</p>
                  <p className="text-purple-500 text-sm mt-2">新しいクエストを待とう！</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-cute">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-blue-500 animate-pulse" />
              <h3 className="text-xl font-bold text-blue-700">⏰ 確認まち</h3>
            </div>
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <div key={task.id} className="pending-card">
                  <h4 className="font-bold text-blue-800">{task.title}</h4>
                  <p className="text-sm text-blue-600 mb-3">{task.category}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">👀 パパママが確認中...</span>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-blue-600">📝 確認まちのクエストはありません</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-cute">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500 animate-bounce" />
              <h3 className="text-xl font-bold text-green-700">🎉 クリア済み</h3>
            </div>
            <div className="space-y-3">
              {completedTasks.slice(0, 5).map(task => (
                <div key={task.id} className="completed-card">
                  <h4 className="font-bold text-green-800">{task.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-green-600 font-medium">{task.category}</span>
                    <span className="text-lg font-bold text-green-600 bg-white px-3 py-1 rounded-full border-2 border-green-300">
                      +{task.points}pt ✨
                    </span>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-green-600">🏆 まだクリアしたクエストはありません</p>
                  <p className="text-green-500 text-sm mt-2">がんばってクエストにチャレンジしよう！</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskSubmissionModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={handleTaskSubmit}
        />
      )}
    </div>
  );
};

interface TaskSubmissionModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (taskId: string, comments: string) => void;
}

const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({ task, onClose, onSubmit }) => {
  const [comments, setComments] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(task.id, comments);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 w-full max-w-md border-4 border-purple-300 shadow-2xl">
        <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">
          🎯 クエスト報告
        </h3>
        
        <div className="mb-6 p-6 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-300">
          <h4 className="font-bold text-orange-800 text-lg">{task.title}</h4>
          <p className="text-sm text-orange-700 mt-2 font-medium">{task.description}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-orange-600 bg-orange-200 px-3 py-1 rounded-full font-medium">{task.category}</span>
            <span className="font-bold text-purple-600 text-xl bg-white px-4 py-2 rounded-full border-2 border-purple-300">
              {task.points}pt 💎
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-bold text-purple-700 mb-3">
              📝 どんなふうにやったか教えてね！
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="input-field text-lg"
              rows={4}
              placeholder="がんばったことや、きづいたことを書いてね✨"
            />
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-lg px-8"
            >
              🔙 やめる
            </button>
            <button
              type="submit"
              className="btn-primary text-lg flex items-center gap-3 px-8"
            >
              <CheckCircle className="w-6 h-6" />
              🚀 ほうこく
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ChildStatsViewProps {
  user: any;
  tasks: Task[];
  completions: TaskCompletion[];
  totalPoints: number; // 現在の残高ポイント
}

const ChildStatsView: React.FC<ChildStatsViewProps> = ({ user, tasks, completions, totalPoints }) => {
  const completedTasks = completions.filter(c => c.status === 'APPROVED');
  const pendingTasks = completions.filter(c => c.status === 'PENDING');
  
  // カテゴリ別統計
  const categoryStats: { [category: string]: number } = {};
  completedTasks.forEach(completion => {
    const task = tasks.find(t => t.id === completion.taskId);
    if (task) {
      categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
    }
  });

  // 最近の実績（直近5件）
  const recentCompletions = completedTasks
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-cute bg-gradient-to-br from-blue-100 to-blue-200">
          <div className="text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-xl font-bold text-blue-800 mb-1">クリア数</h3>
            <p className="text-3xl font-bold text-blue-900">{completedTasks.length}</p>
            <p className="text-sm text-blue-700">がんばったね！</p>
          </div>
        </div>

        <div className="card-cute bg-gradient-to-br from-yellow-100 to-yellow-200">
          <div className="text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="text-xl font-bold text-yellow-800 mb-1">残高</h3>
            <p className="text-3xl font-bold text-yellow-900">{totalPoints}pt</p>
            <p className="text-sm text-yellow-700">お金に変えられるよ！</p>
          </div>
        </div>

        <div className="card-cute bg-gradient-to-br from-purple-100 to-purple-200">
          <div className="text-center">
            <div className="text-4xl mb-2">⏰</div>
            <h3 className="text-xl font-bold text-purple-800 mb-1">確認まち</h3>
            <p className="text-3xl font-bold text-purple-900">{pendingTasks.length}</p>
            <p className="text-sm text-purple-700">まってるよ！</p>
          </div>
        </div>
      </div>

      {/* カテゴリ別実績 */}
      <div className="card-cute">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-8 h-8 text-green-500 animate-bounce" />
          <h3 className="text-xl font-bold text-green-700">🌟 がんばったこと</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(categoryStats).map(([category, count]) => {
            const emojis = {
              '家事': '🏠',
              '勉強': '📚',
              '運動': '🏃‍♀️',
              'その他': '⭐'
            };
            const emoji = emojis[category as keyof typeof emojis] || '🌟';
            
            return (
              <div key={category} className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200">
                <div className="text-3xl mb-2">{emoji}</div>
                <h4 className="font-bold text-green-800 mb-1">{category}</h4>
                <p className="text-2xl font-bold text-green-600">{count}</p>
                <p className="text-xs text-green-700">回できた！</p>
              </div>
            );
          })}
          {Object.keys(categoryStats).length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">まだクリアしたクエストがないよ</p>
              <p className="text-gray-400 text-sm">がんばってチャレンジしよう！</p>
            </div>
          )}
        </div>
      </div>

      {/* 最近の実績 */}
      <div className="card-cute">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-8 h-8 text-orange-500 animate-pulse" />
          <h3 className="text-xl font-bold text-orange-700">🎉 さいきんのがんばり</h3>
        </div>
        <div className="space-y-3">
          {recentCompletions.map(completion => {
            const task = tasks.find(t => t.id === completion.taskId);
            if (!task) return null;
            
            return (
              <div key={completion.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border-2 border-orange-200">
                <div className="text-2xl">🏅</div>
                <div className="flex-1">
                  <h4 className="font-bold text-orange-800">{task.title}</h4>
                  <p className="text-sm text-orange-600">{task.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-orange-700">+{task.points}pt</p>
                  <p className="text-xs text-orange-600">
                    {new Date(completion.submittedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            );
          })}
          {recentCompletions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-orange-500">まだクリアしたクエストがないよ</p>
              <p className="text-orange-400 text-sm">クエストにチャレンジしてみよう！</p>
            </div>
          )}
        </div>
      </div>

      {/* 応援メッセージ */}
      <div className="card-cute bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-300">
        <div className="text-center">
          <div className="text-4xl mb-4">🎈</div>
          <h3 className="text-xl font-bold text-pink-800 mb-4">
            {user?.name}さん、すごいね！
          </h3>
          <div className="space-y-2">
            {completedTasks.length >= 10 && (
              <p className="text-pink-700 font-medium">🌟 クエストマスター！ 10個以上クリアしたよ！</p>
            )}
            {totalPoints >= 100 && (
              <p className="text-purple-700 font-medium">💎 ポイントコレクター！ 100ポイント以上ゲット！</p>
            )}
            {Object.keys(categoryStats).length >= 3 && (
              <p className="text-blue-700 font-medium">🌈 オールラウンダー！ いろんなことができるね！</p>
            )}
            {completedTasks.length === 0 && (
              <p className="text-pink-700 font-medium">✨ がんばってクエストにチャレンジしてみよう！</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;