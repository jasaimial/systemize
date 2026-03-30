'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import type { Task } from '@/lib/types';
import { toast } from 'sonner';
import { format, isPast, isToday, isTomorrow, differenceInHours } from 'date-fns';

const CATEGORY_EMOJI: Record<string, string> = {
  HOMEWORK: '📝',
  PROJECT: '🔬',
  TEST: '📋',
  QUIZ: '❓',
  LOST_ITEM: '🔍',
  PERSONAL: '🎯',
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: () => tasksApi.complete(task.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const xp = response.meta?.xpAwarded || 0;
      toast.success(`Task completed! +${xp} XP`, {
        description: `"${task.title}" is done!`,
      });
    },
    onError: () => {
      toast.error('Failed to complete task');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const isCompleted = task.status === 'COMPLETED';
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isCompleted;

  const getDueDateLabel = () => {
    if (!dueDate) return null;
    if (isToday(dueDate)) return 'Due today';
    if (isTomorrow(dueDate)) return 'Due tomorrow';
    if (isPast(dueDate) && !isCompleted) return 'Overdue';
    const hours = differenceInHours(dueDate, new Date());
    if (hours < 72) return `Due in ${Math.ceil(hours / 24)}d`;
    return format(dueDate, 'MMM d');
  };

  const dueDateLabel = getDueDateLabel();

  return (
    <div
      className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${
        isCompleted
          ? 'border-border/50 bg-muted/30 opacity-75'
          : isOverdue
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Complete checkbox */}
        <button
          onClick={() => !isCompleted && completeMutation.mutate()}
          disabled={isCompleted || completeMutation.isPending}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            isCompleted
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/40 hover:border-primary hover:bg-primary/10'
          } ${completeMutation.isPending ? 'animate-pulse' : ''}`}
          title={isCompleted ? 'Completed' : 'Mark as complete'}
        >
          {isCompleted && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{CATEGORY_EMOJI[task.category] || '📌'}</span>
            <h3
              className={`font-medium truncate ${
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}
            >
              {task.title}
            </h3>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>

            {task.subject && (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {task.subject}
              </span>
            )}

            {dueDateLabel && (
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  isOverdue
                    ? 'bg-destructive/10 text-destructive'
                    : dueDateLabel === 'Due today'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {dueDateLabel}
              </span>
            )}

            {isCompleted && task.xpAwarded > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                +{task.xpAwarded} XP
              </span>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && !isCompleted && (
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Edit"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Delete this task?')) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
