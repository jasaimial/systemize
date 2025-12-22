// Common types for the backend API

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    version?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export enum TaskCategory {
  HOMEWORK = 'HOMEWORK',
  PROJECT = 'PROJECT',
  TEST = 'TEST',
  QUIZ = 'QUIZ',
  LOST_ITEM = 'LOST_ITEM',
  PERSONAL = 'PERSONAL',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  category: TaskCategory;
  priority: Priority;
  status: TaskStatus;
  subject?: string;
  xpAwarded: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpRequired?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: string;
  providerId: string;
  createdAt: Date;
  lastLoginAt?: Date;
}
