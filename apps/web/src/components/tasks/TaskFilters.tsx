'use client';

import { useState } from 'react';
import type { TaskStatus } from '@/lib/types';

const STATUSES: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Active' },
  { value: 'COMPLETED', label: 'Done' },
];

interface TaskFiltersBarProps {
  onFilterChange: (filters: { status?: TaskStatus }) => void;
}

export function TaskFiltersBar({ onFilterChange }: TaskFiltersBarProps) {
  const [status, setStatus] = useState<TaskStatus | ''>('');

  const handleStatus = (value: TaskStatus | '') => {
    setStatus(value);
    onFilterChange({ status: value || undefined });
  };

  return (
    <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5 w-fit">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => handleStatus(s.value)}
          className={`text-xs px-4 py-1.5 rounded-md font-medium transition-colors ${
            status === s.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground active:text-foreground sm:hover:text-foreground'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
