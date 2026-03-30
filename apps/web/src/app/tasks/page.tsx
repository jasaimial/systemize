'use client';

import { TaskList } from '@/components/tasks/TaskList';
import { DevAuthProvider } from '@/components/auth/DevAuthProvider';
import { useAuthStore } from '@/lib/store';

export default function TasksPage() {
  return (
    <DevAuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <TaskList />
        </main>
      </div>
    </DevAuthProvider>
  );
}

function Header() {
  const { logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Systemize
          </h1>
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Tasks</span>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
