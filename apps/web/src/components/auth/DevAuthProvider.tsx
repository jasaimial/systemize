'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

/**
 * Temporary dev auth component.
 * In production, this will be replaced with Azure AD B2C OAuth flow.
 */
export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  if (!isAuthenticated) {
    return <DevLoginScreen />;
  }

  return <>{children}</>;
}

function DevLoginScreen() {
  const { setToken } = useAuthStore();

  const handleDevLogin = async () => {
    try {
      // Generate a token by calling the backend health endpoint first to check connectivity,
      // then use the dev token from localStorage or generate one
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health`
      );
      if (!res.ok) throw new Error('Backend not reachable');

      // For development, we need to generate a JWT token.
      // In a real app, this would come from Azure AD B2C.
      // Use a pre-generated token or prompt for one.
      const token = prompt(
        'Paste your dev JWT token.\n\n' +
          'Generate one by running in the backend folder:\n' +
          'pnpm gentoken'
      );

      if (token?.trim()) {
        setToken(token.trim());
      }
    } catch {
      alert(
        'Cannot reach the backend at ' +
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') +
          '\n\nMake sure the backend is running:\ncd apps/backend && pnpm dev'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 text-center p-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Systemize
          </h1>
          <p className="text-muted-foreground mt-2">Stay Organized, Stay Ahead</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Development Mode
          </p>
          <button
            onClick={handleDevLogin}
            className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Sign In (Dev)
          </button>
          <p className="text-xs text-muted-foreground">
            Run <code className="bg-muted px-1 py-0.5 rounded text-xs">pnpm gentoken</code> in
            the backend to get a token
          </p>
        </div>
      </div>
    </div>
  );
}
