'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import type { CreateTaskInput, TaskCategory, Priority } from '@/lib/types';
import { toast } from 'sonner';

const CATEGORIES: { value: TaskCategory; label: string; emoji: string }[] = [
  { value: 'HOMEWORK', label: 'Homework', emoji: '📝' },
  { value: 'PROJECT', label: 'Project', emoji: '🔬' },
  { value: 'TEST', label: 'Test', emoji: '📋' },
  { value: 'QUIZ', label: 'Quiz', emoji: '❓' },
  { value: 'LOST_ITEM', label: 'Lost Item', emoji: '🔍' },
  { value: 'PERSONAL', label: 'Personal', emoji: '🎯' },
];

const PRIORITIES: { value: Priority; label: string; dot: string }[] = [
  { value: 'HIGH', label: 'High', dot: 'bg-red-500' },
  { value: 'MEDIUM', label: 'Medium', dot: 'bg-yellow-500' },
  { value: 'LOW', label: 'Low', dot: 'bg-green-500' },
];

interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ onSuccess, onCancel }: TaskFormProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<TaskCategory>('HOMEWORK');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to create task');
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setCategory('HOMEWORK');
    setPriority('MEDIUM');
    setSubject('');
    setShowDetails(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      category,
      priority,
      subject: subject.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-primary/20 rounded-lg bg-card overflow-hidden">
      {/* Title row */}
      <div className="px-3 pt-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-medium"
          autoFocus
          maxLength={200}
        />
      </div>

      {/* Description */}
      {showDetails && (
        <div className="px-3 pt-1.5">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            rows={2}
            className="w-full text-xs bg-transparent text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none"
            maxLength={2000}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 mt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="text-[11px] h-7 px-2 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="text-[11px] h-7 px-2 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Subject */}
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="text-[11px] h-7 w-24 px-2 rounded-md border border-border bg-background text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            maxLength={100}
          />

          {/* Due date */}
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-[11px] h-7 px-2 rounded-md border border-border bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          />

          {/* Toggle details */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] h-7 px-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {showDetails ? 'Less' : 'More'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {onCancel && (
            <button
              type="button"
              onClick={() => { resetForm(); onCancel(); }}
              className="text-[11px] h-7 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
            className="text-[11px] h-7 px-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </form>
  );
}
