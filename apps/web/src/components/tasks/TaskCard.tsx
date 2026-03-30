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

const PRIORITY_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
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
      toast.success(`+${xp} XP`, {
        description: `"${task.title}" completed`,
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
      toast('Task deleted', { description: task.title });
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
      className={`group flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 transition-colors hover:bg-accent/40 ${
        isCompleted ? 'opacity-50' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => !isCompleted && completeMutation.mutate()}
        disabled={isCompleted || completeMutation.isPending}
        className={`flex-shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] transition-all ${
          isCompleted
            ? 'border-primary bg-primary'
            : completeMutation.isPending
              ? 'border-primary/50 animate-pulse'
              : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        {isCompleted && (
          <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <span className={`flex-shrink-0 h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />

      {/* Content */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className={`text-sm truncate ${
            isCompleted
              ? 'line-through text-muted-foreground'
              : 'text-foreground font-medium'
          }`}
        >
          {task.title}
        </span>

        {task.description && (
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[200px]">
            {task.description}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {task.subject && (
          <span className="hidden sm:inline-flex text-[11px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
            {task.subject}
          </span>
        )}

        <span className="text-xs text-muted-foreground">
          {CATEGORY_EMOJI[task.category]}
        </span>

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
      </div>

      {/* Actions - appear on hover */}
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && !isCompleted && (
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
