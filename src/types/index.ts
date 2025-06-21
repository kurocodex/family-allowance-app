export interface User {
  id: string;
  name: string;
  email: string;
  role: 'PARENT' | 'CHILD';
  familyId?: string; // 家族ID
  age?: number; // 後方互換性のため残す
  birthDate?: Date; // 新しい生年月日フィールド
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isRecurring: boolean;
  createdBy: string;
  assignedTo?: string; // 対象の子供のID（未指定の場合は全員対象）
  createdAt: Date;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  childId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
  approvedAt?: Date;
  photoUrl?: string;
  comments?: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'EARNED' | 'EXCHANGED' | 'INVESTMENT';
  amount: number;
  description: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  eventType: 'SCORE_BASED' | 'EVALUATION_BASED' | 'COMPLETION_BASED';
  pointsConfig: {
    basePoints: number;
    maxPoints: number;
    scoreThresholds?: { score: number; points: number; }[]; // 点数ベース
    evaluations?: { level: string; points: number; }[]; // 評価ベース
    bonusPoints?: number; // ボーナスポイント
    targetScore?: number; // 目標点数
  };
  assignedTo?: string; // 対象の子供のID
  createdBy: string;
  dueDate?: Date; // 期限
  createdAt: Date;
}

export interface EventResult {
  id: string;
  eventId: string;
  childId: string;
  resultType: 'SCORE' | 'EVALUATION' | 'COMPLETED';
  score?: number; // 点数（テストなど）
  evaluation?: string; // 評価（よくできました、など）
  earnedPoints: number;
  bonusEarned: boolean;
  submittedAt: Date;
  approvedAt?: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
}

export interface RateRule {
  id: string;
  name: string;
  type: 'AGE_BASED' | 'PERIOD_BASED' | 'PERFORMANCE_BASED';
  conditions: {
    minAge?: number;
    maxAge?: number;
    startDate?: Date;
    endDate?: Date;
    taskCategory?: string;
    completionCount?: number;
  };
  multiplier: number;
  bonusPoints?: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

// AuthContextTypeはuseAuth.tsxで定義されています