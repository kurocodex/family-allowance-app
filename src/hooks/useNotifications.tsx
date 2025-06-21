import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../utils/supabase';
import { showLocalNotification } from '../utils/pwa';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task_completed' | 'task_approved' | 'task_rejected' | 'points_awarded' | 'new_task';
  createdAt: Date;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      createdAt: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show browser notification if permission granted
    showLocalNotification(notification.title, notification.message);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Subscribe to Supabase real-time events
  useEffect(() => {
    if (!user?.familyId) return;

    // Task completions subscription (for parents)
    const taskCompletionsSubscription = supabase
      .channel('task_completions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_completions',
          filter: `family_id=eq.${user.familyId}`
        },
        (payload) => {
          if (user.role === 'PARENT' && payload.new.child_id !== user.id) {
            addNotification({
              title: '🎯 タスク完了報告',
              message: 'お子様がタスクを完了しました！承認をお待ちしています。',
              type: 'task_completed',
              data: payload.new
            });
          }
        }
      )
      .subscribe();

    // Task completion updates subscription (for children)
    const taskApprovalSubscription = supabase
      .channel('task_approvals')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'task_completions',
          filter: `child_id=eq.${user.id}`
        },
        (payload) => {
          if (user.role === 'CHILD') {
            const status = payload.new.status;
            if (status === 'APPROVED') {
              addNotification({
                title: '✅ タスク承認',
                message: 'タスクが承認されました！ポイントを獲得しました。',
                type: 'task_approved',
                data: payload.new
              });
            } else if (status === 'REJECTED') {
              addNotification({
                title: '❌ タスク却下',
                message: 'タスクが却下されました。もう一度挑戦してみましょう。',
                type: 'task_rejected',
                data: payload.new
              });
            }
          }
        }
      )
      .subscribe();

    // New tasks subscription (for children)
    const newTasksSubscription = supabase
      .channel('new_tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `family_id=eq.${user.familyId}`
        },
        (payload) => {
          if (user.role === 'CHILD') {
            // Check if task is assigned to this child or all children
            if (!payload.new.assigned_to || payload.new.assigned_to === user.id) {
              addNotification({
                title: '🆕 新しいクエスト',
                message: `新しいクエスト「${payload.new.title}」が追加されました！`,
                type: 'new_task',
                data: payload.new
              });
            }
          }
        }
      )
      .subscribe();

    // Point transactions subscription (for children)
    const pointsSubscription = supabase
      .channel('point_transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'point_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (user.role === 'CHILD' && payload.new.type === 'EARNED') {
            addNotification({
              title: '💎 ポイント獲得',
              message: `${payload.new.amount}ポイントを獲得しました！`,
              type: 'points_awarded',
              data: payload.new
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      taskCompletionsSubscription.unsubscribe();
      taskApprovalSubscription.unsubscribe();
      newTasksSubscription.unsubscribe();
      pointsSubscription.unsubscribe();
    };
  }, [user?.familyId, user?.id, user?.role]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};