'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import type { TaskFilters } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { TaskFiltersBar } from './TaskFilters';

export function TaskList() {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.list(filters),
  });

  const tasks = response?.data || [];
  const pagination = response?.meta?.pagination;

  // Group tasks: overdue first, then pending, then completed
  const groupedTasks = {
    overdue: tasks.filter(
      (t) => t.status === 'PENDING' && t.dueDate && new Date(t.dueDate) < new Date()
    ),
    pending: tasks.filter(
      (t) =>
        t.status === 'PENDING' &&
        (!t.dueDate || new Date(t.dueDate) >= new Date())
    ),
    completed: tasks.filter((t) => t.status === 'COMPLETED'),
  };

  if (error) {
    const isAuthError = (error as Error & { response?: { status?: number } })?.response?.status === 401;
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
        <p className="text-destructive font-medium">
          {isAuthError
            ? 'Authentication required. Please set your token.'
            : 'Failed to load tasks'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          {pagination && (
            <p className="text-sm text-muted-foreground mt-1">
              {pagination.total} task{pagination.total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? (
            'Close'
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">New Task</h2>
          <TaskForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Filters */}
      <TaskFiltersBar onFilterChange={setFilters} />

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-muted" />
                    <div className="h-5 w-20 rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task sections */}
      {!isLoading && tasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-medium text-foreground">No tasks yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click &quot;Add Task&quot; to get started!
          </p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* Overdue */}
          {groupedTasks.overdue.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide mb-2">
                Overdue ({groupedTasks.overdue.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.overdue.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {/* Pending */}
          {groupedTasks.pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Pending ({groupedTasks.pending.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.pending.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {groupedTasks.completed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Completed ({groupedTasks.completed.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.completed.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
            }
            disabled={!pagination.page || pagination.page <= 1}
            className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
            }
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
