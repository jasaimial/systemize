import axios from 'axios';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ApiResponse,
  TaskFilters,
  UserProgress,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Tasks API
export const tasksApi = {
  list: async (filters?: TaskFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value));
      });
    }
    const { data } = await api.get<ApiResponse<Task[]>>(`/tasks?${params}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return data;
  },

  create: async (input: CreateTaskInput) => {
    const { data } = await api.post<ApiResponse<Task>>('/tasks', input);
    return data;
  },

  update: async (id: string, input: UpdateTaskInput) => {
    const { data } = await api.put<ApiResponse<Task>>(`/tasks/${id}`, input);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/tasks/${id}`);
    return data;
  },

  complete: async (id: string) => {
    const { data } = await api.post<
      ApiResponse<Task> & { meta?: { xpAwarded?: number; progress?: UserProgress } }
    >(`/tasks/${id}/complete`);
    return data;
  },

  uncomplete: async (id: string) => {
    const { data } = await api.post<
      ApiResponse<Task> & { meta?: { xpDeducted?: number; progress?: UserProgress } }
    >(`/tasks/${id}/uncomplete`);
    return data;
  },

  upcoming: async () => {
    const { data } = await api.get<ApiResponse<Task[]>>('/tasks/upcoming');
    return data;
  },

  overdue: async () => {
    const { data } = await api.get<ApiResponse<Task[]>>('/tasks/overdue');
    return data;
  },
};

// Auth API
export const authApi = {
  login: async (name: string) => {
    const { data } = await api.post<ApiResponse<{ token: string; user: { id: string; name: string; email: string } }>>('/auth/login', { name });
    return data;
  },

  me: async () => {
    const { data } = await api.get<ApiResponse<{ id: string; name: string; email: string; progress: UserProgress | null; badgeCount: number }>>('/auth/me');
    return data;
  },
};

// Progress API
export const progressApi = {
  getProgress: async () => {
    const { data } = await api.get<ApiResponse<UserProgress & { xpToNextLevel: number; levelProgress: number }>>('/progress');
    return data;
  },

  getBadges: async () => {
    const { data } = await api.get<ApiResponse<Array<{ id: string; name: string; description: string; icon: string; earned: boolean; earnedAt: string | null }>>>('/progress/badges');
    return data;
  },

  getStats: async () => {
    const { data } = await api.get<ApiResponse<{ totalTasks: number; completedTasks: number; pendingTasks: number; completionRate: number; totalXPEarned: number }>>('/progress/stats');
    return data;
  },
};

export default api;
