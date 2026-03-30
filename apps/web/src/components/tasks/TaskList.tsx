'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import type { Task } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { isToday, isThisWeek, isPast, isFuture, endOfWeek, startOfWeek, addWeeks, endOfMonth } from 'date-fns';

type DateFilter = 'all' | 'overdue' | 'today' | 'this-week' | 'next-week' | 'this-month';

const FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This week' },
];

const MORE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'next-week', label: 'Next week' },
  { value: 'this-month', label: 'This month' },
];

function matchesFilter(task: Task, filter: DateFilter): boolean {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  switch (filter) {
    case 'all':
      return true;
    case 'overdue':
      return !!due && isPast(due);
    case 'today':
      return !!due && isToday(due);
    case 'this-week':
      return !!due && isThisWeek(due, { weekStartsOn: 1 });
    case 'next-week': {
      if (!due) return false;
      const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
      const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
      return due >= nextWeekStart && due <= nextWeekEnd;
    }
    case 'this-month':
      return !!due && due <= endOfMonth(new Date()) && isFuture(due);
    default:
      return true;
  }
}

export function TaskList() {
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DateFilter>('all');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMoreFilters) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoreFilters]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list({ status: 'PENDING', limit: 500, sortBy: 'dueDate', sortOrder: 'asc' }),
  });

  const allTasks = response?.data || [];
  const pagination = response?.meta?.pagination;

  // Apply date filter
  const tasks = useMemo(
    () => allTasks.filter((t) => matchesFilter(t, activeFilter)),
    [allTasks, activeFilter]
  );

  // Group filtered tasks
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  );
  const upcomingTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) >= new Date()
  );
  const noDueDateTasks = tasks.filter((t) => !t.dueDate);

  if (error) {
    const isAuthError = (error as Error & { response?: { status?: number } })?.response?.status === 401;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">
          {isAuthError ? 'Session expired' : 'Failed to load tasks'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isAuthError ? 'Please sign in again.' : 'Check your connection and try again.'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 -mb-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setActiveFilter(f.value); setShowMoreFilters(false); }}
            className={`flex-shrink-0 text-xs h-8 px-3 rounded-full font-medium transition-colors ${
              activeFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground active:bg-accent sm:hover:bg-accent hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* More dropdown */}
        <div className="relative flex-shrink-0" ref={moreRef}>
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center gap-1 text-xs h-8 px-3 rounded-full font-medium transition-colors ${
              MORE_FILTERS.some((f) => f.value === activeFilter)
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground active:bg-accent sm:hover:bg-accent hover:text-foreground'
            }`}
          >
            {MORE_FILTERS.find((f) => f.value === activeFilter)?.label || (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </button>
          {showMoreFilters && (
            <div className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-border bg-card shadow-lg overflow-hidden min-w-[120px]">
              {MORE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setActiveFilter(f.value); setShowMoreFilters(false); }}
                  className={`w-full text-left text-xs px-3 py-2.5 transition-colors ${
                    activeFilter === f.value
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground active:bg-accent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Task count */}
        <span className="flex-shrink-0 text-[11px] text-muted-foreground tabular-nums ml-auto">
          {tasks.length}{activeFilter !== 'all' ? ` / ${allTasks.length}` : ''} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Desktop new task button */}
      <div className="flex items-center justify-end -mt-2">
        {/* Desktop button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors ${
            showForm
              ? 'text-muted-foreground hover:text-foreground'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {showForm ? (
            'Cancel'
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New task
            </>
          )}
        </button>
      </div>

      {/* Quick add form */}
      {showForm && (
        <TaskForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="rounded-lg border border-border overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 animate-pulse">
              <div className="h-[18px] w-[18px] rounded-full bg-muted" />
              <div className="h-2 w-2 rounded-full bg-muted" />
              <div className="h-3 rounded bg-muted flex-1 max-w-[200px]" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No tasks</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first task to get started.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-xs text-primary hover:underline font-medium"
            >
              + New task
            </button>
          )}
        </div>
      )}

      {/* Task groups */}
      {!isLoading && tasks.length > 0 && (
        <div className="space-y-5">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <TaskSection label="Overdue" count={overdueTasks.length} variant="destructive">
              {overdueTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </TaskSection>
          )}

          {/* Upcoming */}
          {upcomingTasks.length > 0 && (
            <TaskSection label="Upcoming" count={upcomingTasks.length}>
              {upcomingTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </TaskSection>
          )}

          {/* No due date */}
          {noDueDateTasks.length > 0 && (
            <TaskSection label="No date" count={noDueDateTasks.length} variant="muted">
              {noDueDateTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </TaskSection>
          )}
        </div>
      )}

      {/* Mobile FAB — floating add button */}
      <button
        onClick={() => {
          setShowForm(!showForm);
          if (!showForm) window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="sm:hidden fixed bottom-[5.5rem] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        aria-label={showForm ? 'Close form' : 'Add task'}
      >
        <svg
          className={`h-6 w-6 transition-transform ${showForm ? 'rotate-45' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

function TaskSection({
  label,
  count,
  variant,
  children,
}: {
  label: string;
  count: number;
  variant?: 'destructive' | 'muted';
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-1.5 px-3">
        <h2
          className={`text-[11px] font-semibold uppercase tracking-wider ${
            variant === 'destructive'
              ? 'text-destructive'
              : 'text-muted-foreground'
          }`}
        >
          {label}
        </h2>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {count}
        </span>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {children}
      </div>
    </section>
  );
}
