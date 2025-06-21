import React, { useState, useEffect } from 'react';
import { User, Task, TaskCompletion, PointTransaction, EventResult } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';
import { calculateAge } from '../utils/dateUtils';
import { BarChart3, TrendingUp, Award, Calendar, Target, PieChart } from 'lucide-react';

interface StatisticsData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalPoints: number; // 現在の残高ポイント
  earnedPoints: number; // 獲得総ポイント
  spentPoints: number; // 使用総ポイント
  averagePointsPerTask: number;
  categoryStats: { [category: string]: number };
  monthlyProgress: { month: string; completed: number; points: number }[];
  completionRate: number;
}

const Statistics: React.FC = () => {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'1month' | '3months' | '6months' | 'all'>('3months');

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      calculateStatistics(selectedChild);
    }
  }, [selectedChild, timeRange]);

  const loadChildren = () => {
    const allChildren = storage.getUsers().filter(u => u.role === 'CHILD');
    setChildren(allChildren);
    if (allChildren.length > 0 && !selectedChild) {
      setSelectedChild(allChildren[0].id);
    }
  };

  const calculateStatistics = (childId: string) => {
    const tasks = storage.getTasks();
    const completions = storage.getTaskCompletions().filter(c => c.childId === childId);
    const transactions = storage.getPointTransactions().filter(t => t.userId === childId);
    const eventResults = storage.getEventResults().filter(r => r.childId === childId);

    // Time range filtering
    const now = new Date();
    const timeRangeMonths = timeRange === '1month' ? 1 : timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 999;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - timeRangeMonths, now.getDate());

    const filteredCompletions = timeRange === 'all' ? completions : 
      completions.filter(c => new Date(c.submittedAt) >= cutoffDate);
    const filteredTransactions = timeRange === 'all' ? transactions :
      transactions.filter(t => new Date(t.createdAt) >= cutoffDate);

    // Basic stats
    const completedTasks = filteredCompletions.filter(c => c.status === 'APPROVED').length;
    const pendingTasks = filteredCompletions.filter(c => c.status === 'PENDING').length;
    const totalTasks = filteredCompletions.length;

    // Point stats
    const earnedPoints = filteredTransactions
      .filter(t => t.type === 'EARNED')
      .reduce((sum, t) => sum + t.amount, 0);
    const spentPoints = filteredTransactions
      .filter(t => t.type === 'EXCHANGED')
      .reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = earnedPoints - spentPoints;

    // Category stats
    const categoryStats: { [category: string]: number } = {};
    filteredCompletions
      .filter(c => c.status === 'APPROVED')
      .forEach(completion => {
        const task = tasks.find(t => t.id === completion.taskId);
        if (task) {
          categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
        }
      });

    // Monthly progress
    const monthlyProgress: { month: string; completed: number; points: number }[] = [];
    for (let i = timeRangeMonths - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthCompletions = completions.filter(c => 
        c.status === 'APPROVED' &&
        new Date(c.submittedAt) >= monthDate &&
        new Date(c.submittedAt) < nextMonthDate
      );

      const monthTransactions = transactions.filter(t =>
        t.type === 'EARNED' &&
        new Date(t.createdAt) >= monthDate &&
        new Date(t.createdAt) < nextMonthDate
      );

      const monthPoints = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

      monthlyProgress.push({
        month: monthDate.toLocaleDateString('ja-JP', { month: 'short' }),
        completed: monthCompletions.length,
        points: monthPoints
      });
    }

    const stats: StatisticsData = {
      totalTasks,
      completedTasks,
      pendingTasks,
      totalPoints: currentBalance,
      earnedPoints,
      spentPoints,
      averagePointsPerTask: completedTasks > 0 ? Math.round(earnedPoints / completedTasks) : 0,
      categoryStats,
      monthlyProgress,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    setStatistics(stats);
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || '不明';
  };

  const getChildAge = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.birthDate ? calculateAge(child.birthDate) : child?.age || 0;
  };

  if (children.length === 0) {
    return (
      <div className="card text-center py-12">
        <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">まだお子様が登録されていません</h3>
        <p className="text-gray-500">統計を表示するには、まずお子様を登録してください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-purple-800">📊 統計・レポート</h2>
      </div>

      {/* 子供選択とフィルター */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">👧 お子様を選択</label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="input-field"
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name} ({child.birthDate ? `${calculateAge(child.birthDate)}歳` : `${child.age || 0}歳`})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 期間</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="input-field"
            >
              <option value="1month">過去1ヶ月</option>
              <option value="3months">過去3ヶ月</option>
              <option value="6months">過去6ヶ月</option>
              <option value="all">全期間</option>
            </select>
          </div>
        </div>
      </div>

      {statistics && (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-3">
                <Target className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-blue-600 text-sm font-medium">完了したクエスト</p>
                  <p className="text-2xl font-bold text-blue-800">{statistics.completedTasks}</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center gap-3">
                <Award className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-green-600 text-sm font-medium">現在の残高</p>
                  <p className="text-2xl font-bold text-green-800">{statistics.totalPoints}</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-purple-600 text-sm font-medium">達成率</p>
                  <p className="text-2xl font-bold text-purple-800">{statistics.completionRate}%</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-orange-600 text-sm font-medium">平均ポイント/クエスト</p>
                  <p className="text-2xl font-bold text-orange-800">{statistics.averagePointsPerTask}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 月次進捗グラフ */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-blue-500" />
              <h3 className="text-xl font-bold text-blue-700">📈 月次進捗</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 完了クエスト数の推移 */}
              <div>
                <h4 className="font-bold text-gray-700 mb-4">完了したクエスト数</h4>
                <div className="space-y-3">
                  {statistics.monthlyProgress.map((month, index) => {
                    const maxCompleted = Math.max(...statistics.monthlyProgress.map(m => m.completed), 1);
                    const percentage = (month.completed / maxCompleted) * 100;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600 w-12">{month.month}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-6 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            {month.completed}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 獲得ポイントの推移 */}
              <div>
                <h4 className="font-bold text-gray-700 mb-4">獲得ポイント</h4>
                <div className="space-y-3">
                  {statistics.monthlyProgress.map((month, index) => {
                    const maxPoints = Math.max(...statistics.monthlyProgress.map(m => m.points), 1);
                    const percentage = (month.points / maxPoints) * 100;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600 w-12">{month.month}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-6 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            {month.points}pt
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* カテゴリ別統計 */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="w-8 h-8 text-purple-500" />
              <h3 className="text-xl font-bold text-purple-700">📋 カテゴリ別実績</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(statistics.categoryStats).map(([category, count]) => {
                const maxCount = Math.max(...Object.values(statistics.categoryStats), 1);
                const percentage = (count / maxCount) * 100;
                const colors = {
                  '家事': 'from-pink-400 to-pink-600',
                  '勉強': 'from-blue-400 to-blue-600',
                  '運動': 'from-green-400 to-green-600',
                  'その他': 'from-gray-400 to-gray-600'
                };
                const color = colors[category as keyof typeof colors] || 'from-purple-400 to-purple-600';
                
                return (
                  <div key={category} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                    <div className="text-center">
                      <h4 className="font-bold text-gray-800 mb-2">{category}</h4>
                      <div className="relative w-20 h-20 mx-auto mb-3">
                        <div className="w-full h-full bg-gray-200 rounded-full"></div>
                        <div 
                          className={`absolute inset-0 bg-gradient-to-br ${color} rounded-full transition-all flex items-center justify-center`}
                          style={{ 
                            background: `conic-gradient(from 0deg, currentColor ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`,
                          }}
                        >
                          <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center">
                            <span className="font-bold text-gray-800 text-sm">{count}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">完了数</p>
                    </div>
                  </div>
                );
              })}
              {Object.keys(statistics.categoryStats).length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">まだ完了したクエストがありません</p>
                </div>
              )}
            </div>
          </div>

          {/* 詳細データ */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-800 mb-6">📊 詳細データ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-bold text-gray-700">クエスト実績</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-medium">完了したクエスト</span>
                    <span className="font-bold text-blue-800">{statistics.completedTasks}個</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-700 font-medium">確認待ちクエスト</span>
                    <span className="font-bold text-yellow-800">{statistics.pendingTasks}個</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">合計クエスト</span>
                    <span className="font-bold text-gray-800">{statistics.totalTasks}個</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-700">ポイント実績</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-medium">獲得総ポイント</span>
                    <span className="font-bold text-blue-800">{statistics.earnedPoints}pt</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700 font-medium">使用ポイント</span>
                    <span className="font-bold text-red-800">{statistics.spentPoints}pt</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">現在の残高</span>
                    <span className="font-bold text-green-800">{statistics.totalPoints}pt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;