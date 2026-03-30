'use client';

import { TaskList } from '@/components/tasks/TaskList';
import { DevAuthProvider } from '@/components/auth/DevAuthProvider';
import { AppShell } from '@/components/layout/AppShell';

export default function TasksPage() {
  return (
    <DevAuthProvider>
      <AppShell>
        <TaskList />
      </AppShell>
    </DevAuthProvider>
  );
}
