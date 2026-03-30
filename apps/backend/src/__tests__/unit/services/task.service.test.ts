import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { TaskService } from '../../../services/task.service';
import prisma from '../../../lib/db';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('TaskService Unit Tests', () => {
  let taskService: TaskService;
  const testUserId = 'user-123';
  const testTaskId = 'task-123';

  beforeAll(() => {
    taskService = new TaskService();
  });

  beforeEach(() => {
    mockReset(prismaMock);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Gamification - XP Calculation', () => {
    it('should award ON_TIME XP (100) when there is no due date', async () => {
      const mockTask = { id: testTaskId, userId: testUserId, status: 'PENDING' as const, dueDate: null, xpAwarded: 0 };
      
      // @ts-ignore
      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      // @ts-ignore
      prismaMock.task.update.mockResolvedValue({ ...mockTask, status: 'COMPLETED', xpAwarded: 100 });
      // @ts-ignore
      prismaMock.userProgress.upsert.mockResolvedValue({ totalXP: 100, lastActivityAt: new Date() });
      // @ts-ignore
      prismaMock.userProgress.update.mockResolvedValue({ totalXP: 100 });
      // @ts-ignore
      prismaMock.task.aggregate.mockResolvedValue({ _sum: { xpAwarded: 100 } });

      const result = await taskService.complete(testUserId, testTaskId);
      expect(result.xpAwarded).toBe(100);
    });

    it('should award EARLY XP (150) when completed > 24h before due date', async () => {
      const now = new Date('2026-03-20T12:00:00Z');
      jest.setSystemTime(now);

      const mockTask = { id: testTaskId, userId: testUserId, status: 'PENDING' as const, dueDate: new Date('2026-03-22T12:00:00Z'), xpAwarded: 0 };

      // @ts-ignore
      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      // @ts-ignore
      prismaMock.task.update.mockResolvedValue({ ...mockTask, status: 'COMPLETED', xpAwarded: 150 });
      // @ts-ignore
      prismaMock.userProgress.upsert.mockResolvedValue({ totalXP: 150, lastActivityAt: now });
      // @ts-ignore
      prismaMock.userProgress.update.mockResolvedValue({ totalXP: 150 });

      const result = await taskService.complete(testUserId, testTaskId);
      expect(result.xpAwarded).toBe(150); 
    });

    it('should award OVERDUE XP (50) when completed past due date', async () => {
      const now = new Date('2026-03-25T12:00:00Z');
      jest.setSystemTime(now);

      const mockTask = { id: testTaskId, userId: testUserId, status: 'PENDING' as const, dueDate: new Date('2026-03-24T12:00:00Z'), xpAwarded: 0 };

      // @ts-ignore
      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      // @ts-ignore
      prismaMock.task.update.mockResolvedValue({ ...mockTask, status: 'COMPLETED', xpAwarded: 50 });
      // @ts-ignore
      prismaMock.userProgress.upsert.mockResolvedValue({ totalXP: 50, lastActivityAt: now });
      // @ts-ignore
      prismaMock.userProgress.update.mockResolvedValue({ totalXP: 50 });

      const result = await taskService.complete(testUserId, testTaskId);
      expect(result.xpAwarded).toBe(50);
    });
  });

  describe('Gamification - Edge Cases Context', () => {
    it('should calculate level progression properly from underlying service mapping', () => {
      // @ts-ignore
      const servicePrivate = taskService;
      expect(servicePrivate['calculateLevel'](0)).toBe(1);
      expect(servicePrivate['calculateLevel'](499)).toBe(1);
      expect(servicePrivate['calculateLevel'](500)).toBe(2);
      expect(servicePrivate['calculateLevel'](1499)).toBe(2);
      expect(servicePrivate['calculateLevel'](1500)).toBe(3);
      expect(servicePrivate['calculateLevel'](2999)).toBe(3);
      expect(servicePrivate['calculateLevel'](3000)).toBe(4);
      expect(servicePrivate['calculateLevel'](5000)).toBe(5);
    });

    it('should increment streak if previous activity was strictly yesterday', () => {
      // @ts-ignore
      const servicePrivate = taskService;
      const now = new Date('2026-03-20T12:00:00Z');
      jest.setSystemTime(now);
      
      const result = servicePrivate['calculateStreak']({
        currentStreak: 5, longestStreak: 5, lastActivityAt: new Date('2026-03-19T10:00:00Z')
      });
      expect(result.currentStreak).toBe(6);
      expect(result.longestStreak).toBe(6);
    });

    it('should maintain streak without incrementing if activity was earlier today', () => {
      // @ts-ignore
      const servicePrivate = taskService;
      const now = new Date('2026-03-20T18:00:00Z');
      jest.setSystemTime(now);
      
      const result = servicePrivate['calculateStreak']({
        currentStreak: 5, longestStreak: 5, lastActivityAt: new Date('2026-03-20T10:00:00Z')
      });
      expect(result.currentStreak).toBe(5);
    });

    it('should reset streak if previous activity was > 1 day ago', () => {
       // @ts-ignore
       const servicePrivate = taskService;
       const now = new Date('2026-03-22T12:00:00Z');
       jest.setSystemTime(now);
       
       const result = servicePrivate['calculateStreak']({
         currentStreak: 5, longestStreak: 5, lastActivityAt: new Date('2026-03-20T10:00:00Z')
       });
       expect(result.currentStreak).toBe(1);
       expect(result.longestStreak).toBe(5);
    });
  });
});
