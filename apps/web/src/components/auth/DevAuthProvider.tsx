'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

/**
 * Temporary dev auth component.
 * In production, this will be replaced with Azure AD B2C OAuth flow.
 */
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
    return <DevLoginScreen />;
  }

  return <>{children}</>;
}

function DevLoginScreen() {
  const { setToken } = useAuthStore();

  const handleDevLogin = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health`
      );
      if (!res.ok) throw new Error('Backend not reachable');

      const token = prompt(
        'Paste your dev JWT token.\n\n' +
          'Generate one by running in apps/backend:\n' +
          'pnpm gentoken'
      );

      if (token?.trim()) {
        setToken(token.trim());
      }
    } catch {
      alert(
        'Cannot reach backend at ' +
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') +
          '\n\nStart it with: cd apps/backend && pnpm dev'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Systemize
          </h1>
          <p className="text-xs text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="rounded-lg border border-border p-5 space-y-4">
          <button
            onClick={handleDevLogin}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Sign in with token
          </button>

          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <p>Development mode.</p>
            <p className="mt-1">
              Run <code className="bg-secondary px-1 py-0.5 rounded text-[10px] font-mono">pnpm gentoken</code> in the backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
