
export type ViewName = 'dashboard' | 'focus' | 'tasks' | 'learning' | 'habits' | 'forecast' | 'review' | 'reports' | 'settings' | 'auth' | 'work';

export interface Task {
  id: string;
  title: string;
  time: string;
  date: string;
  completed: boolean;
  type: 'task';
  priority?: 'high' | 'medium' | 'low';
  tag?: string;
  actualDuration?: number;
  completedAt?: string;
  intensity?: 'low' | 'medium' | 'high';
  nextBridge?: string;
  notified?: boolean;
}

export interface HorizonPotential {
  id: string;
  title: string;
  targetDate: string;
  time?: string;
  category: 'idea' | 'admin' | 'learning' | 'task' | 'rest';
  status: 'dormant' | 'ready' | 'converted' | 'dismissed';
  linkedTopicId?: string;
  createdAt: string;
}

export type Attribute = 'STR' | 'INT' | 'WIL' | 'FOC' | 'REC';

export interface UserStats {
  STR: number; // Strength - Physical & Action
  INT: number; // Intellect - Learning & Logic
  WIL: number; // Willpower - Difficult Tasks
  FOC: number; // Focus - Deep Work
  REC: number; // Recovery - Sleep & Mindfulness
}

export interface Habit {
  id: string;
  title: string;
  streak: number; // Derived from history
  completed: boolean; // Derived from history[today]
  history: Record<string, boolean>; // 'YYYY-MM-DD': true
  type: 'habit';
  reminderTime?: string;
  velocity?: number; // 0-100 score based on last 30 days
  attribute: Attribute;
  baseXp: number; // Fixed base XP reward
}

export type TopicStatus = 'active' | 'mastered' | 'archived';
export type TopicDifficulty = 'easy' | 'medium' | 'hard';
export type TopicPriority = 'low' | 'medium' | 'high';

export interface LearningSession {
  date: string;
  duration: number;
  action: 'learn' | 're-read' | 'hard' | 'mastered' | 'extra';
}

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'learning';
  status: TopicStatus;
  difficulty: TopicDifficulty;
  priority: TopicPriority;
  currentStep: number;
  nextReviewDate: string | null;
  lastReviewDate: string | null;
  history: string[];
  totalMinutes: number;
  sessions: LearningSession[];
  nextBridge?: string;
}

export type ReportRange = 'month' | '6month' | 'year';

export interface HistoricalReport {
  id: string;
  range: ReportRange;
  periodLabel: string;
  generatedAt: string;
  tasksCompleted: number;
  minutesFocused: number;
  topTopic?: string;
  insight: string;
  viewed: boolean;
}

export interface CloudConfig {
  provider: 'none' | 'supabase' | 'google-sheet';
  url?: string;
  apiKey?: string;
  autoSync: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  bio: string;
  email?: string;
  password?: string;
  xp: number;
  stats: UserStats; // RPG Stats
  freezeInventory: number; // Number of Streak Freezes available
  lastLogin?: string;
  voiceEnabled: boolean;
  emailSettings: {
    enabled: boolean;
    frequency: 'monthly';
  };
  cloudConfig: CloudConfig;
}

export interface MicroSegment {
  id: string;
  segmentNumber: number;
  startedAt: string;
  goal: string;
  outcome: 'continue' | 'park' | 'enough';
  completedAt?: string;
}

export interface MomentumSession {
  id: string;
  status: 'active' | 'completed' | 'paused';
  totalSegments: number;
  segments: MicroSegment[];
}

export interface DayReflection {
  date: string;
  wins: string;
  blockers: string;
  mood: string;
  energy: string;
  quality: number;
  summary: string;
}

export interface WorkSession {
  id: string;
  details: string;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
}

export interface AppData {
  tasks: Task[];
  habits: Habit[];
  topics: LearningTopic[];
  potentials: HorizonPotential[];
  user: UserProfile;
  archivedTasks: Task[];
  historicalReports: HistoricalReport[];
  aiHistory: string[];
  reflections: DayReflection[];
  workSessions?: WorkSession[];
}
