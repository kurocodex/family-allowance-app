import { useState, useEffect } from 'react';
import { Task, TaskCompletion, PointTransaction, User } from '../types';
import { database } from '../utils/database';

interface UseChildDataReturn {
  tasks: Task[];
  myCompletions: TaskCompletion[];
  myPoints: number;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useChildData(user: User | null): UseChildDataReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myCompletions, setMyCompletions] = useState<TaskCompletion[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.familyId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 並列でデータを取得
      const [tasksData, completionsData, transactionsData] = await Promise.all([
        database.getTasks(user.familyId),
        database.getTaskCompletions(user.familyId),
        database.getPointTransactions(user.familyId)
      ]);
      
      setTasks(tasksData);
      setMyCompletions(completionsData.filter(c => c.childId === user.id));
      
      // ポイント残高計算
      const myTransactions = transactionsData.filter(t => t.userId === user.id);
      const earnedPoints = myTransactions
        .filter(t => t.type === 'EARNED')
        .reduce((sum, t) => sum + t.amount, 0);
      const spentPoints = myTransactions
        .filter(t => t.type === 'EXCHANGED')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setMyPoints(earnedPoints - spentPoints);
    } catch (err) {
      console.error('子供データ読み込みエラー:', err);
      setError('データの読み込みに失敗しました。しばらく待ってから再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  // user.familyIdが変更された時にデータを再読み込み
  useEffect(() => {
    loadData();
  }, [user?.familyId]);

  return {
    tasks,
    myCompletions,
    myPoints,
    loading,
    error,
    refreshData: loadData
  };
}