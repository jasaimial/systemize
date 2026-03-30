'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

function LoginScreen() {
  const { setToken } = useAuthStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await authApi.login(name.trim());
      if (response.success && response.data?.token) {
        setToken(response.data.token);
      } else {
        setError('Login failed. Try again.');
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || '';
      if (message.includes('Network Error')) {
        setError('Cannot reach server. Is the backend running?');
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Systemize
          </h1>
          <p className="text-xs text-muted-foreground">What&apos;s your name?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            maxLength={50}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-40"
          >
            {isSubmitting ? 'Signing in...' : 'Continue'}
          </button>
          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
