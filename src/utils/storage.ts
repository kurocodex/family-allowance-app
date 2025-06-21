import { User, Task, TaskCompletion, PointTransaction, Event, EventResult, RateRule } from '../types';

const STORAGE_KEYS = {
  USERS: 'family_allowance_users',
  TASKS: 'family_allowance_tasks',
  TASK_COMPLETIONS: 'family_allowance_task_completions',
  POINT_TRANSACTIONS: 'family_allowance_point_transactions',
  EVENTS: 'family_allowance_events',
  EVENT_RESULTS: 'family_allowance_event_results',
  RATE_RULES: 'family_allowance_rate_rules',
  CURRENT_USER: 'family_allowance_current_user'
};

export const storage = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  saveUsers: (users: User[]): void => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getTasks: (): Task[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  },

  saveTasks: (tasks: Task[]): void => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getTaskCompletions: (): TaskCompletion[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASK_COMPLETIONS);
    return data ? JSON.parse(data) : [];
  },

  saveTaskCompletions: (completions: TaskCompletion[]): void => {
    localStorage.setItem(STORAGE_KEYS.TASK_COMPLETIONS, JSON.stringify(completions));
  },

  getPointTransactions: (): PointTransaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.POINT_TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  savePointTransactions: (transactions: PointTransaction[]): void => {
    localStorage.setItem(STORAGE_KEYS.POINT_TRANSACTIONS, JSON.stringify(transactions));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getEvents: (): Event[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
  },

  saveEvents: (events: Event[]): void => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  },

  getEventResults: (): EventResult[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EVENT_RESULTS);
    return data ? JSON.parse(data) : [];
  },

  saveEventResults: (results: EventResult[]): void => {
    localStorage.setItem(STORAGE_KEYS.EVENT_RESULTS, JSON.stringify(results));
  },

  getRateRules: (): RateRule[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RATE_RULES);
    return data ? JSON.parse(data) : [];
  },

  saveRateRules: (rules: RateRule[]): void => {
    localStorage.setItem(STORAGE_KEYS.RATE_RULES, JSON.stringify(rules));
  },

  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};