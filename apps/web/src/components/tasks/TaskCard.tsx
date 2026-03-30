'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import type { Task } from '@/lib/types';
import { toast } from 'sonner';
import { format, isPast, isToday, isTomorrow, differenceInHours } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const queryClient = useQueryClient();
  const [justCompleted, setJustCompleted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const completeMutation = useMutation({
    mutationFn: () => tasksApi.complete(task.id),
    onMutate: async () => {
      // Show strike-through animation immediately, but DON'T move to completed section yet
      setJustCompleted(true);

      // After 1.5s, apply the real optimistic update (moves to "Done" section)
      timeoutRef.current = setTimeout(() => {
        setJustCompleted(false);
        queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) => {
          const prev = old as { data?: Task[] } | undefined;
          if (!prev?.data) return prev;
          return {
            ...prev,
            data: prev.data.map((t) =>
              t.id === task.id
                ? { ...t, status: 'COMPLETED' as const, completedAt: new Date().toISOString(), xpAwarded: 100 }
                : t
            ),
          };
        });
      }, 1500);

      // Save previous data for rollback
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['tasks'] });
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      setJustCompleted(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Failed to complete task');
    },
    onSettled: () => {
      // Refetch after server confirms (will reconcile with real data)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }, 1600);
    },
    onSuccess: (response) => {
      const xp = response.meta?.xpAwarded || 0;
      toast.success(`+${xp} XP`, { description: `"${task.title}" completed` });
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: () => tasksApi.uncomplete(task.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['tasks'] });
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) => {
        const prev = old as { data?: Task[] } | undefined;
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: prev.data.map((t) =>
            t.id === task.id
              ? { ...t, status: 'PENDING' as const, completedAt: null, xpAwarded: 0 }
              : t
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Failed to reopen task');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSuccess: () => {
      toast('Task reopened', { description: task.title });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(task.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['tasks'] });
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) => {
        const prev = old as { data?: Task[] } | undefined;
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: prev.data.filter((t) => t.id !== task.id),
        };
      });
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Failed to delete task');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSuccess: () => {
      toast('Task deleted', { description: task.title });
    },
  });

  // Undo during the 1.5s animation window
  const undoDuringAnimation = () => {
    setJustCompleted(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Revert on server
    uncompleteMutation.mutate();
  };

  const isCompleted = task.status === 'COMPLETED';
  const showAsCompleted = isCompleted || justCompleted;
  const isToggling = completeMutation.isPending || uncompleteMutation.isPending;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !showAsCompleted;

  const getDueDateLabel = () => {
    if (!dueDate) return null;
    if (isCompleted) return format(dueDate, 'MMM d');
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    if (isPast(dueDate)) return 'Overdue';
    const hours = differenceInHours(dueDate, new Date());
    if (hours < 72) return `${Math.ceil(hours / 24)}d`;
    return format(dueDate, 'MMM d');
  };

  const dueDateLabel = getDueDateLabel();

  return (
    <div
      className={`group relative px-3 sm:px-3 py-3 border-b border-border last:border-b-0 transition-all duration-500 active:bg-accent/40 sm:hover:bg-accent/40 ${
        showAsCompleted ? 'opacity-50' : ''
      }`}
    >
      {/* Top row: checkbox + title + due date */}
      <div className="flex items-start gap-3">
        {/* Checkbox — larger touch target on mobile */}
        <button
          onClick={() => {
            if (justCompleted) {
              undoDuringAnimation();
            } else if (isCompleted) {
              uncompleteMutation.mutate();
            } else {
              completeMutation.mutate();
            }
          }}
          disabled={isToggling && !justCompleted}
          className={`flex-shrink-0 mt-0.5 flex h-5 w-5 sm:h-[18px] sm:w-[18px] items-center justify-center rounded-full border-[1.5px] transition-all duration-300 ${
            showAsCompleted
              ? 'border-primary bg-primary hover:bg-primary/70 hover:border-primary/70'
              : isToggling
                ? 'border-primary/50 animate-pulse'
                : 'border-muted-foreground/30 hover:border-primary'
          }`}
        >
          {showAsCompleted && (
            <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {task.priority === 'HIGH' && !showAsCompleted && (
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-red-500 fill-red-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            )}
            <span className="relative text-sm truncate font-medium text-foreground">
              {task.title}
              {/* Animated strike-through line */}
              <span
                className={`absolute left-0 top-1/2 h-[1.5px] bg-muted-foreground transition-all duration-700 ease-out ${
                  showAsCompleted ? 'w-full' : 'w-0'
                }`}
              />
            </span>
          </div>

          {/* Second line: metadata */}
          <div className="flex items-center gap-2 mt-1">
            {dueDateLabel && (
              <span
                className={`text-[11px] font-medium tabular-nums ${
                  isOverdue
                    ? 'text-destructive'
                    : dueDateLabel === 'Today'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-muted-foreground'
                }`}
              >
                {dueDateLabel}
              </span>
            )}

            {isCompleted && task.xpAwarded > 0 && (
              <span className="text-[11px] font-medium text-primary">
                +{task.xpAwarded}
              </span>
            )}

            {justCompleted && (
              <span className="text-[11px] font-medium text-primary animate-pulse">
                +XP
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>

        {/* Actions — always visible on mobile, hover on desktop */}
        <div className="flex-shrink-0 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="p-1.5 -mr-1.5 rounded-md active:bg-destructive/10 sm:hover:bg-destructive/10 text-muted-foreground active:text-destructive sm:hover:text-destructive transition-colors"
          >
            <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
