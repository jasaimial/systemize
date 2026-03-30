'use client';

import { useState } from 'react';
import type { TaskCategory, Priority, TaskStatus } from '@/lib/types';

const STATUSES: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Active' },
  { value: 'COMPLETED', label: 'Done' },
];

const CATEGORIES: { value: TaskCategory | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'HOMEWORK', label: '📝 Homework' },
  { value: 'PROJECT', label: '🔬 Project' },
  { value: 'TEST', label: '📋 Test' },
  { value: 'QUIZ', label: '❓ Quiz' },
  { value: 'LOST_ITEM', label: '🔍 Lost Item' },
  { value: 'PERSONAL', label: '🎯 Personal' },
];

const PRIORITIES: { value: Priority | ''; label: string }[] = [
  { value: '', label: 'All priorities' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
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
    <div className="flex items-center gap-1.5">
      {/* Status tabs */}
      <div className="flex items-center rounded-md border border-border bg-secondary/50 p-0.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => handleChange('status', s.value)}
            className={`text-[11px] px-2.5 py-1 rounded-[4px] font-medium transition-colors ${
              status === s.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <span className="w-px h-4 bg-border" />

      {/* Dropdowns */}
      <select
        value={category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="text-[11px] h-7 px-2 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
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
        className="text-[11px] h-7 px-2 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
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
          className="text-[11px] h-7 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
