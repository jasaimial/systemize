'use client';

import { useState } from 'react';
import type { TaskCategory, Priority, TaskStatus } from '@/lib/types';

const CATEGORIES: { value: TaskCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'HOMEWORK', label: '📝 Homework' },
  { value: 'PROJECT', label: '🔬 Project' },
  { value: 'TEST', label: '📋 Test' },
  { value: 'QUIZ', label: '❓ Quiz' },
  { value: 'LOST_ITEM', label: '🔍 Lost Item' },
  { value: 'PERSONAL', label: '🎯 Personal' },
];

const PRIORITIES: { value: Priority | ''; label: string }[] = [
  { value: '', label: 'All Priorities' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const STATUSES: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
];

interface TaskFiltersBarProps {
  onFilterChange: (filters: {
    status?: TaskStatus;
    category?: TaskCategory;
    priority?: Priority;
  }) => void;
}

export function TaskFiltersBar({ onFilterChange }: TaskFiltersBarProps) {
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');

  const handleChange = (
    field: 'status' | 'category' | 'priority',
    value: string
  ) => {
    const newFilters = {
      status: field === 'status' ? value : status,
      category: field === 'category' ? value : category,
      priority: field === 'priority' ? value : priority,
    };

    if (field === 'status') setStatus(value as TaskStatus | '');
    if (field === 'category') setCategory(value as TaskCategory | '');
    if (field === 'priority') setPriority(value as Priority | '');

    onFilterChange({
      status: newFilters.status ? (newFilters.status as TaskStatus) : undefined,
      category: newFilters.category ? (newFilters.category as TaskCategory) : undefined,
      priority: newFilters.priority ? (newFilters.priority as Priority) : undefined,
    });
  };

  const hasActiveFilters = status || category || priority;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={priority}
        onChange={(e) => handleChange('priority', e.target.value)}
        className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={() => {
            setStatus('');
            setCategory('');
            setPriority('');
            onFilterChange({});
          }}
          className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
