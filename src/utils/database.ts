import { supabase } from './supabase';
import { User, Task, TaskCompletion, PointTransaction, Event, EventResult, RateRule } from '../types';

export const database = {
  // ユーザー関連
  async getUsers(familyId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) throw error;
    return data?.map(user => ({
      ...user,
      createdAt: new Date(user.created_at),
      birthDate: user.birth_date ? new Date(user.birth_date) : undefined
    })) || [];
  },

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        family_id: user.familyId,
        name: user.name,
        role: user.role,
        birth_date: user.birthDate?.toISOString(),
        age: user.age
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      createdAt: new Date(data.created_at),
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined
    };
  },

  // タスク関連
  async getTasks(familyId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) throw error;
    return data?.map(task => ({
      ...task,
      createdAt: new Date(task.created_at)
    })) || [];
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt'>, familyId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        family_id: familyId,
        title: task.title,
        description: task.description,
        points: task.points,
        category: task.category,
        difficulty: task.difficulty,
        is_recurring: task.isRecurring,
        created_by: task.createdBy,
        assigned_to: task.assignedTo
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      isRecurring: data.is_recurring,
      createdBy: data.created_by,
      assignedTo: data.assigned_to,
      createdAt: new Date(data.created_at)
    };
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        points: updates.points,
        category: updates.category,
        difficulty: updates.difficulty,
        is_recurring: updates.isRecurring,
        assigned_to: updates.assignedTo
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      isRecurring: data.is_recurring,
      createdBy: data.created_by,
      assignedTo: data.assigned_to,
      createdAt: new Date(data.created_at)
    };
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // タスク完了関連
  async getTaskCompletions(familyId: string): Promise<TaskCompletion[]> {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) throw error;
    return data?.map(completion => ({
      ...completion,
      taskId: completion.task_id,
      childId: completion.child_id,
      submittedAt: new Date(completion.submitted_at),
      approvedAt: completion.approved_at ? new Date(completion.approved_at) : undefined,
      photoUrl: completion.photo_url
    })) || [];
  },

  async createTaskCompletion(completion: Omit<TaskCompletion, 'id'>, familyId: string): Promise<TaskCompletion> {
    const { data, error } = await supabase
      .from('task_completions')
      .insert({
        family_id: familyId,
        task_id: completion.taskId,
        child_id: completion.childId,
        status: completion.status,
        submitted_at: completion.submittedAt.toISOString(),
        approved_at: completion.approvedAt?.toISOString(),
        photo_url: completion.photoUrl,
        comments: completion.comments
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      taskId: data.task_id,
      childId: data.child_id,
      submittedAt: new Date(data.submitted_at),
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      photoUrl: data.photo_url
    };
  },

  async updateTaskCompletion(id: string, updates: Partial<TaskCompletion>): Promise<TaskCompletion> {
    const { data, error } = await supabase
      .from('task_completions')
      .update({
        status: updates.status,
        approved_at: updates.approvedAt?.toISOString(),
        comments: updates.comments
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      taskId: data.task_id,
      childId: data.child_id,
      submittedAt: new Date(data.submitted_at),
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      photoUrl: data.photo_url
    };
  },

  // ポイント取引関連
  async getPointTransactions(familyId: string): Promise<PointTransaction[]> {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) throw error;
    return data?.map(transaction => ({
      ...transaction,
      userId: transaction.user_id,
      createdAt: new Date(transaction.created_at)
    })) || [];
  },

  async createPointTransaction(transaction: Omit<PointTransaction, 'id'>, familyId: string): Promise<PointTransaction> {
    const { data, error } = await supabase
      .from('point_transactions')
      .insert({
        family_id: familyId,
        user_id: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        created_at: transaction.createdAt.toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      userId: data.user_id,
      createdAt: new Date(data.created_at)
    };
  },

  // イベント関連
  async getEvents(familyId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) throw error;
    return data?.map(event => ({
      ...event,
      eventType: event.event_type,
      pointsConfig: event.points_config,
      assignedTo: event.assigned_to,
      createdBy: event.created_by,
      dueDate: event.due_date ? new Date(event.due_date) : undefined,
      createdAt: new Date(event.created_at)
    })) || [];
  },

  async createEvent(event: Omit<Event, 'id' | 'createdAt'>, familyId: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert({
        family_id: familyId,
        title: event.title,
        description: event.description,
        category: event.category,
        event_type: event.eventType,
        points_config: event.pointsConfig,
        assigned_to: event.assignedTo,
        created_by: event.createdBy,
        due_date: event.dueDate?.toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      eventType: data.event_type,
      pointsConfig: data.points_config,
      assignedTo: data.assigned_to,
      createdBy: data.created_by,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      createdAt: new Date(data.created_at)
    };
  },

  // イベント結果関連
  async getEventResults(familyId: string): Promise<EventResult[]> {
    const { data, error } = await supabase
      .from('event_results')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) throw error;
    return data?.map(result => ({
      ...result,
      eventId: result.event_id,
      childId: result.child_id,
      resultType: result.result_type,
      earnedPoints: result.earned_points,
      bonusEarned: result.bonus_earned,
      submittedAt: new Date(result.submitted_at),
      approvedAt: result.approved_at ? new Date(result.approved_at) : undefined
    })) || [];
  },

  async createEventResult(result: Omit<EventResult, 'id'>, familyId: string): Promise<EventResult> {
    const { data, error } = await supabase
      .from('event_results')
      .insert({
        family_id: familyId,
        event_id: result.eventId,
        child_id: result.childId,
        result_type: result.resultType,
        score: result.score,
        evaluation: result.evaluation,
        earned_points: result.earnedPoints,
        bonus_earned: result.bonusEarned,
        submitted_at: result.submittedAt.toISOString(),
        approved_at: result.approvedAt?.toISOString(),
        status: result.status,
        comments: result.comments
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      eventId: data.event_id,
      childId: data.child_id,
      resultType: data.result_type,
      earnedPoints: data.earned_points,
      bonusEarned: data.bonus_earned,
      submittedAt: new Date(data.submitted_at),
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined
    };
  },

  // レートルール関連
  async getRateRules(familyId: string): Promise<RateRule[]> {
    const { data, error } = await supabase
      .from('rate_rules')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) throw error;
    return data?.map(rule => ({
      ...rule,
      isActive: rule.is_active,
      createdAt: new Date(rule.created_at),
      conditions: {
        ...rule.conditions,
        startDate: rule.conditions.startDate ? new Date(rule.conditions.startDate) : undefined,
        endDate: rule.conditions.endDate ? new Date(rule.conditions.endDate) : undefined
      }
    })) || [];
  },

  async createRateRule(rule: Omit<RateRule, 'id' | 'createdAt'>, familyId: string): Promise<RateRule> {
    const { data, error } = await supabase
      .from('rate_rules')
      .insert({
        family_id: familyId,
        name: rule.name,
        type: rule.type,
        conditions: rule.conditions,
        multiplier: rule.multiplier,
        bonus_points: rule.bonusPoints,
        description: rule.description,
        is_active: rule.isActive
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      isActive: data.is_active,
      bonusPoints: data.bonus_points,
      createdAt: new Date(data.created_at),
      conditions: {
        ...data.conditions,
        startDate: data.conditions.startDate ? new Date(data.conditions.startDate) : undefined,
        endDate: data.conditions.endDate ? new Date(data.conditions.endDate) : undefined
      }
    };
  },

  // ユーティリティ
  generateId(): string {
    return crypto.randomUUID();
  }
};