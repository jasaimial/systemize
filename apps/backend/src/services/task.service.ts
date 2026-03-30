import { Prisma } from '@prisma/client';
import prisma from '../lib/db';
import { AppError } from '../middleware/errorHandler';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '../validators/task.validator';

// XP award rules from product spec
const XP_RULES = {
  ON_TIME: 100,
  EARLY: 150, // >1 day before due date
  OVERDUE: 50,
  PERFECT_DAY_BONUS: 200,
};

export class TaskService {
  /**
   * Create a new task
   */
  async create(userId: string, input: CreateTaskInput) {
    const task = await prisma.task.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        category: input.category,
        priority: input.priority,
        subject: input.subject ?? null,
      },
    });

    return task;
  }

  /**
   * Get a single task by ID (scoped to user)
   */
  async getById(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new AppError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    return task;
  }

  /**
   * List tasks with filters, pagination, and sorting
   */
  async list(userId: string, query: ListTasksQuery) {
    const where: Prisma.TaskWhereInput = { userId };

    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority;
    if (query.subject) where.subject = query.subject;

    const skip = (query.page - 1) * query.limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get tasks due in the next 7 days
   */
  async getUpcoming(userId: string) {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          gte: now,
          lte: nextWeek,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return tasks;
  }

  /**
   * Get overdue tasks
   */
  async getOverdue(userId: string) {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return tasks;
  }

  /**
   * Update a task
   */
  async update(userId: string, taskId: string, input: UpdateTaskInput) {
    // Ensure task exists and belongs to user
    await this.getById(userId, taskId);

    const data: Prisma.TaskUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    if (input.category !== undefined) data.category = input.category;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.status !== undefined) data.status = input.status;
    if (input.subject !== undefined) data.subject = input.subject;

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    return task;
  }

  /**
   * Delete a task
   */
  async delete(userId: string, taskId: string) {
    // Ensure task exists and belongs to user
    await this.getById(userId, taskId);

    await prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Mark a task as complete, calculate and award XP
   */
  async complete(userId: string, taskId: string) {
    const task = await this.getById(userId, taskId);

    if (task.status === 'COMPLETED') {
      throw new AppError(400, 'Task is already completed', 'TASK_ALREADY_COMPLETED');
    }

    // Calculate XP
    const now = new Date();
    let xp = XP_RULES.ON_TIME;

    if (task.dueDate) {
      if (now > task.dueDate) {
        // Overdue completion
        xp = XP_RULES.OVERDUE;
      } else {
        const msUntilDue = task.dueDate.getTime() - now.getTime();
        const hoursUntilDue = msUntilDue / (1000 * 60 * 60);
        if (hoursUntilDue > 24) {
          // Early completion (>1 day before due)
          xp = XP_RULES.EARLY;
        }
      }
    }

    // Update task
    const completedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        xpAwarded: xp,
      },
    });

    // Update user progress
    const progress = await this.updateUserProgress(userId, xp);

    return {
      task: completedTask,
      xpAwarded: xp,
      progress,
    };
  }

  /**
   * Undo task completion — reverts status and deducts XP
   */
  async uncomplete(userId: string, taskId: string) {
    const task = await this.getById(userId, taskId);

    if (task.status !== 'COMPLETED') {
      throw new AppError(400, 'Task is not completed', 'TASK_NOT_COMPLETED');
    }

    const xpToDeduct = task.xpAwarded;

    // Revert task
    const revertedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'PENDING',
        completedAt: null,
        xpAwarded: 0,
      },
    });

    // Deduct XP from user progress
    const progress = await this.updateUserProgress(userId, -xpToDeduct);

    return {
      task: revertedTask,
      xpDeducted: xpToDeduct,
      progress,
    };
  }

  /**
   * Update user progress: XP, level, streak
   */
  private async updateUserProgress(userId: string, xpToAdd: number) {
    // Upsert progress record
    const progress = await prisma.userProgress.upsert({
      where: { userId },
      create: {
        userId,
        totalXP: xpToAdd,
        currentLevel: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: new Date(),
      },
      update: {
        totalXP: { increment: xpToAdd },
        lastActivityAt: new Date(),
      },
    });

    // Calculate new level based on XP thresholds from product spec
    const newLevel = this.calculateLevel(progress.totalXP);

    // Update streak
    const streakData = this.calculateStreak(progress);

    const updatedProgress = await prisma.userProgress.update({
      where: { userId },
      data: {
        currentLevel: newLevel,
        ...streakData,
      },
    });

    return updatedProgress;
  }

  /**
   * Calculate level from XP
   * Level 1: 0-499 XP
   * Level 2: 500-1499 XP
   * Level 3: 1500-2999 XP
   * Level 4: 3000-4999 XP
   * Level 5: 5000+ XP
   */
  private calculateLevel(totalXP: number): number {
    if (totalXP >= 5000) return 5;
    if (totalXP >= 3000) return 4;
    if (totalXP >= 1500) return 3;
    if (totalXP >= 500) return 2;
    return 1;
  }

  /**
   * Calculate streak based on last activity
   */
  private calculateStreak(progress: {
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: Date;
  }) {
    const now = new Date();
    const lastActivity = new Date(progress.lastActivityAt);

    // Check if last activity was yesterday or today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDay = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate()
    );

    const daysDiff = Math.floor(
      (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = progress.currentStreak;

    if (daysDiff === 0) {
      // Same day — streak stays the same (already counted)
      return {};
    } else if (daysDiff === 1) {
      // Consecutive day — increment streak
      newStreak = progress.currentStreak + 1;
    } else {
      // Streak broken — reset to 1
      newStreak = 1;
    }

    return {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, progress.longestStreak),
    };
  }
}

export const taskService = new TaskService();
