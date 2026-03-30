import { z } from 'zod';

// Allowed enum values
const TaskCategoryEnum = z.enum([
  'HOMEWORK',
  'PROJECT',
  'TEST',
  'QUIZ',
  'LOST_ITEM',
  'PERSONAL',
]);

const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const TaskStatusEnum = z.enum(['PENDING', 'COMPLETED', 'OVERDUE']);

// Create task schema
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format, use ISO 8601' })
    .optional()
    .nullable(),
  category: TaskCategoryEnum.default('HOMEWORK'),
  priority: PriorityEnum.default('MEDIUM'),
  subject: z
    .string()
    .max(100, 'Subject must be 100 characters or less')
    .optional()
    .nullable(),
});

// Update task schema — all fields optional
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format, use ISO 8601' })
    .optional()
    .nullable(),
  category: TaskCategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  status: TaskStatusEnum.optional(),
  subject: z
    .string()
    .max(100, 'Subject must be 100 characters or less')
    .optional()
    .nullable(),
});

// Query params for listing tasks
export const listTasksQuerySchema = z.object({
  status: TaskStatusEnum.optional(),
  category: TaskCategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  subject: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['dueDate', 'createdAt', 'priority', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
