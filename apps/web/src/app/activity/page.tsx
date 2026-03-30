'use client';

import { DevAuthProvider } from '@/components/auth/DevAuthProvider';
import { AppShell } from '@/components/layout/AppShell';

export default function ActivityPage() {
  return (
    <DevAuthProvider>
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">Your recent activity will show here.</p>
          <p className="text-xs text-muted-foreground mt-4">Coming soon</p>
        </div>
      </AppShell>
    </DevAuthProvider>
  );
}
