'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import type { CreateTaskInput } from '@/lib/types';
import { toast } from 'sonner';
import { format, addDays, nextSunday, addWeeks } from 'date-fns';

function toDateStr(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

const today = () => toDateStr(new Date());
const tomorrow = () => toDateStr(addDays(new Date(), 1));
const thisWeekEnd = () => toDateStr(nextSunday(new Date()));
const nextWeekEnd = () => toDateStr(nextSunday(addWeeks(new Date(), 1)));

interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ onSuccess, onCancel }: TaskFormProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(today());
  const [isImportant, setIsImportant] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isPreset = (value: string) => [today(), tomorrow(), thisWeekEnd(), nextWeekEnd()].includes(value);

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['tasks'] });
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) => {
        const prev = old as { data?: CreateTaskInput[] } | undefined;
        if (!prev?.data) return prev;
        const optimisticTask = {
          id: `temp-${Date.now()}`,
          userId: '',
          title: input.title,
          description: input.description || null,
          dueDate: input.dueDate || null,
          category: 'HOMEWORK' as const,
          priority: input.priority || 'MEDIUM',
          status: 'PENDING' as const,
          subject: null,
          xpAwarded: 0,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, data: [optimisticTask, ...prev.data] };
      });
      resetForm();
      onSuccess?.();
      return { previousData };
    },
    onError: (_err, _input, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Failed to create task');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSuccess: () => {
      toast.success('Task created');
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(today());
    setIsImportant(false);
    setShowDatePicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate ? new Date(dueDate + 'T23:59:59').toISOString() : null,
      priority: isImportant ? 'HIGH' : 'MEDIUM',
    });
  };

  const activeDateChip = (value: string) =>
    dueDate === value
      ? 'bg-primary text-primary-foreground'
      : 'bg-secondary text-muted-foreground active:bg-accent sm:hover:bg-accent hover:text-foreground';

  return (
    <form onSubmit={handleSubmit} className="border border-primary/20 rounded-lg bg-card overflow-hidden">
      {/* Title */}
      <div className="px-4 pt-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?"
          className="w-full text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-medium"
          autoFocus
          maxLength={200}
        />
      </div>

      {/* Description — always visible */}
      <div className="px-4 pt-1">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full text-xs bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none"
          maxLength={2000}
        />
      </div>

      {/* Due date chips */}
      <div className="flex items-center gap-1.5 px-4 pt-1 flex-wrap">
        <span className="text-[11px] text-muted-foreground mr-0.5">Due:</span>
        <button
          type="button"
          onClick={() => { setDueDate(today()); setShowDatePicker(false); }}
          className={`text-xs h-7 px-2.5 rounded-full font-medium transition-colors ${activeDateChip(today())}`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => { setDueDate(tomorrow()); setShowDatePicker(false); }}
          className={`text-xs h-7 px-2.5 rounded-full font-medium transition-colors ${activeDateChip(tomorrow())}`}
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => { setDueDate(thisWeekEnd()); setShowDatePicker(false); }}
          className={`text-xs h-7 px-2.5 rounded-full font-medium transition-colors ${activeDateChip(thisWeekEnd())}`}
        >
          This week
        </button>
        <button
          type="button"
          onClick={() => { setDueDate(nextWeekEnd()); setShowDatePicker(false); }}
          className={`text-xs h-7 px-2.5 rounded-full font-medium transition-colors ${activeDateChip(nextWeekEnd())}`}
        >
          Next week
        </button>
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`text-xs h-7 px-2.5 rounded-full font-medium transition-colors ${
            !isPreset(dueDate) && dueDate
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground active:bg-accent sm:hover:bg-accent hover:text-foreground'
          }`}
        >
          {!isPreset(dueDate) && dueDate ? format(new Date(dueDate + 'T00:00:00'), 'MMM d') : '...'}
        </button>
      </div>

      {/* Date picker — shown on demand */}
      {showDatePicker && (
        <div className="px-4 pt-1.5">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => { setDueDate(e.target.value); setShowDatePicker(false); }}
            className="text-xs h-9 sm:h-7 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto"
            autoFocus
          />
        </div>
      )}

      {/* Bottom bar: flag + actions */}
      <div className="flex items-center justify-between px-4 py-3 mt-1">
        {/* Flag toggle */}
        <button
          type="button"
          onClick={() => setIsImportant(!isImportant)}
          className={`flex items-center gap-1.5 text-xs h-8 px-2.5 rounded-md transition-colors ${
            isImportant
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'text-muted-foreground active:bg-accent sm:hover:bg-accent hover:text-foreground'
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 ${isImportant ? 'fill-current' : ''}`}
            fill={isImportant ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
          {isImportant ? 'Important' : 'Flag'}
        </button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={() => { resetForm(); onCancel(); }}
              className="text-xs h-8 sm:h-7 px-3 rounded-md text-muted-foreground hover:text-foreground active:bg-accent sm:hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
            className="text-xs h-8 sm:h-7 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </form>
  );
}
