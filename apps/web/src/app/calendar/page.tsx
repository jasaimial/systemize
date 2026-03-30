'use client';

import { DevAuthProvider } from '@/components/auth/DevAuthProvider';
import { AppShell } from '@/components/layout/AppShell';

export default function CalendarPage() {
  return (
    <DevAuthProvider>
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">See your tasks on a calendar view.</p>
          <p className="text-xs text-muted-foreground mt-4">Coming soon</p>
        </div>
      </AppShell>
    </DevAuthProvider>
  );
}
