import { useState, useEffect } from 'react';
import { Task, TaskCompletion, User } from '../types';
import { database } from '../utils/database';

interface UseParentDataReturn {
  tasks: Task[];
  pendingCompletions: TaskCompletion[];
  children: User[];
  childrenPoints: { [childId: string]: number };
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useParentData(user: User | null): UseParentDataReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<TaskCompletion[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [childrenPoints, setChildrenPoints] = useState<{ [childId: string]: number }>({});
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
      const [tasksData, completionsData, usersData, transactionsData] = await Promise.all([
        database.getTasks(user.familyId),
        database.getTaskCompletions(user.familyId),
        database.getUsers(user.familyId),
        database.getPointTransactions(user.familyId)
      ]);
      
      setTasks(tasksData);
      setPendingCompletions(completionsData.filter(c => c.status === 'PENDING'));
      
      const childrenData = usersData.filter(u => u.role === 'CHILD');
      setChildren(childrenData);
      
      // 各子供のポイント残高を計算
      const pointsMap: { [childId: string]: number } = {};
      childrenData.forEach(child => {
        const childTransactions = transactionsData.filter(t => t.userId === child.id);
        const earnedPoints = childTransactions
          .filter(t => t.type === 'EARNED')
          .reduce((sum, t) => sum + t.amount, 0);
        const spentPoints = childTransactions
          .filter(t => t.type === 'EXCHANGED')
          .reduce((sum, t) => sum + t.amount, 0);
        pointsMap[child.id] = earnedPoints - spentPoints;
      });
      setChildrenPoints(pointsMap);
      
    } catch (err) {
      console.error('親データ読み込みエラー:', err);
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
    pendingCompletions,
    children,
    childrenPoints,
    loading,
    error,
    refreshData: loadData
  };
}