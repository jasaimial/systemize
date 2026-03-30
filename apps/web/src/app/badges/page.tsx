'use client';

import { DevAuthProvider } from '@/components/auth/DevAuthProvider';
import { AppShell } from '@/components/layout/AppShell';

export default function BadgesPage() {
  return (
    <DevAuthProvider>
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M18.75 4.236V2.721M16.27 9.728l-.104.106a6.004 6.004 0 01-8.332 0l-.104-.106m8.54 0a7.504 7.504 0 01-8.54 0" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Badges</h1>
          <p className="text-sm text-muted-foreground mt-1">Earn badges by completing tasks and streaks.</p>
          <p className="text-xs text-muted-foreground mt-4">Coming soon</p>
        </div>
      </AppShell>
    </DevAuthProvider>
  );
}
