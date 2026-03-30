// Shared types between frontend and backend

export type TaskCategory =
  | 'HOMEWORK'
  | 'PROJECT'
  | 'TEST'
  | 'QUIZ'
  | 'LOST_ITEM'
  | 'PERSONAL';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  category: TaskCategory;
  priority: Priority;
  status: TaskStatus;
  subject: string | null;
  xpAwarded: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  category?: TaskCategory;
  priority?: Priority;
  subject?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  category?: TaskCategory;
  priority?: Priority;
  status?: TaskStatus;
  subject?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    pagination?: Pagination;
    xpAwarded?: number;
    progress?: UserProgress;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: Priority;
  subject?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'createdAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}
