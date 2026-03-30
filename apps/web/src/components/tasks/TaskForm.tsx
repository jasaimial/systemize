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

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: 'High', color: 'bg-red-100 text-red-800' },
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

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created!', { description: `"${title}" has been added.` });
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error('Failed to create task', {
        description: error?.response?.data?.error?.message || 'Something went wrong',
      });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setCategory('HOMEWORK');
    setPriority('MEDIUM');
    setSubject('');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Math Homework Chapter 5"
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
          maxLength={200}
          autoFocus
        />
      </div>

      {/* Category & Priority row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject & Due Date row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Mathematics"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-foreground mb-1">
            Due Date
          </label>
          <input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          maxLength={2000}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background text-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createMutation.isPending || !title.trim()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? 'Creating...' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}
