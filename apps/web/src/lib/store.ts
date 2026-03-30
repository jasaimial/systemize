'use client';

import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  loadToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAuthenticated: false, isLoading: false });
  },

  loadToken: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
