import request from 'supertest';
import express from 'express';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

import { errorHandler } from '../../middleware/errorHandler';
import routes from '../../routes';
import { config } from '../../config/env';
import { generateTestToken } from '../helpers/testUtils';
import prisma from '../../lib/db';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Task Routes', () => {
  let app: express.Application;
  let validToken: string;
  const testUserId = 'test-user-id';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(`/api/${config.apiVersion}`, routes);
    app.use(errorHandler);
    validToken = generateTestToken({ id: testUserId });
  });

  beforeEach(() => {
    mockReset(prismaMock);
  });

  // Sample task data returned from Prisma
  const sampleTask = {
    id: 'task-1',
    userId: testUserId,
    title: 'Math Homework',
    description: 'Complete chapter 5',
    dueDate: new Date('2026-04-05T23:59:59.000Z'),
    category: 'HOMEWORK' as const,
    priority: 'HIGH' as const,
    status: 'PENDING' as const,
    subject: 'Mathematics',
    xpAwarded: 0,
    completedAt: null,
    createdAt: new Date('2026-03-29T10:00:00.000Z'),
    updatedAt: new Date('2026-03-29T10:00:00.000Z'),
  };

  // ========================================================================
  // Authentication
  // ========================================================================

  describe('Authentication Required', () => {
    it('GET /api/v1/tasks should require authentication', async () => {
      const response = await request(app).get('/api/v1/tasks');
      expect(response.status).toBe(401);
    });

    it('POST /api/v1/tasks should require authentication', async () => {
      const response = await request(app).post('/api/v1/tasks');
      expect(response.status).toBe(401);
    });

    it('GET /api/v1/tasks/:id should require authentication', async () => {
      const response = await request(app).get('/api/v1/tasks/123');
      expect(response.status).toBe(401);
    });
  });

  // ========================================================================
  // POST /api/v1/tasks — Create
  // ========================================================================

  describe('POST /api/v1/tasks', () => {
    it('should create a task with valid data', async () => {
      prismaMock.task.create.mockResolvedValue(sampleTask);

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Math Homework',
          description: 'Complete chapter 5',
          dueDate: '2026-04-05T23:59:59.000Z',
          category: 'HOMEWORK',
          priority: 'HIGH',
          subject: 'Mathematics',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Math Homework');
      expect(prismaMock.task.create).toHaveBeenCalledTimes(1);
    });

    it('should create a task with minimal fields', async () => {
      prismaMock.task.create.mockResolvedValue({
        ...sampleTask,
        description: null,
        dueDate: null,
        subject: null,
        category: 'HOMEWORK' as const,
        priority: 'MEDIUM' as const,
      });

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Math Homework' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject task with empty title', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject task with invalid category', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Test', category: 'INVALID' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject task with invalid date format', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Test', dueDate: 'not-a-date' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ========================================================================
  // GET /api/v1/tasks — List
  // ========================================================================

  describe('GET /api/v1/tasks', () => {
    it('should return paginated tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([sampleTask]);
      prismaMock.task.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.pagination).toEqual({
        page: 1,
        limit: 500,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by status', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/tasks?status=COMPLETED')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'COMPLETED' }),
        })
      );
    });

    it('should filter by category', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/tasks?category=TEST')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'TEST' }),
        })
      );
    });

    it('should support pagination params', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(50);

      const response = await request(app)
        .get('/api/v1/tasks?page=2&limit=10')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });
  });

  // ========================================================================
  // GET /api/v1/tasks/upcoming
  // ========================================================================

  describe('GET /api/v1/tasks/upcoming', () => {
    it('should return upcoming tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([sampleTask]);

      const response = await request(app)
        .get('/api/v1/tasks/upcoming')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ========================================================================
  // GET /api/v1/tasks/overdue
  // ========================================================================

  describe('GET /api/v1/tasks/overdue', () => {
    it('should return overdue tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/tasks/overdue')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ========================================================================
  // GET /api/v1/tasks/:id — Get by ID
  // ========================================================================

  describe('GET /api/v1/tasks/:id', () => {
    it('should return a task by ID', async () => {
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);

      const response = await request(app)
        .get('/api/v1/tasks/task-1')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('task-1');
    });

    it('should return 404 for non-existent task', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/tasks/nonexistent')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('TASK_NOT_FOUND');
    });
  });

  // ========================================================================
  // PUT /api/v1/tasks/:id — Update
  // ========================================================================

  describe('PUT /api/v1/tasks/:id', () => {
    it('should update a task', async () => {
      const updatedTask = { ...sampleTask, title: 'Updated Title' };
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.task.update.mockResolvedValue(updatedTask);

      const response = await request(app)
        .put('/api/v1/tasks/task-1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should return 404 when updating nonexistent task', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/tasks/nonexistent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
    });

    it('should reject invalid update data', async () => {
      const response = await request(app)
        .put('/api/v1/tasks/task-1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ priority: 'INVALID' });

      expect(response.status).toBe(400);
    });
  });

  // ========================================================================
  // DELETE /api/v1/tasks/:id
  // ========================================================================

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete a task', async () => {
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.task.delete.mockResolvedValue(sampleTask);

      const response = await request(app)
        .delete('/api/v1/tasks/task-1')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Task deleted successfully');
    });

    it('should return 404 when deleting nonexistent task', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/tasks/nonexistent')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ========================================================================
  // POST /api/v1/tasks/:id/complete — Complete task
  // ========================================================================

  describe('POST /api/v1/tasks/:id/complete', () => {
    it('should complete a task and award XP', async () => {
      const completedTask = {
        ...sampleTask,
        status: 'COMPLETED' as const,
        completedAt: new Date(),
        xpAwarded: 100,
      };
      const progress = {
        id: 'prog-1',
        userId: testUserId,
        totalXP: 100,
        currentLevel: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.task.update.mockResolvedValue(completedTask);
      prismaMock.userProgress.upsert.mockResolvedValue(progress);
      prismaMock.userProgress.update.mockResolvedValue(progress);
      // Badge service mocks
      prismaMock.task.count.mockResolvedValue(1);
      prismaMock.userBadge.findMany.mockResolvedValue([]);
      prismaMock.badge.findMany.mockResolvedValue([]);
      prismaMock.task.aggregate.mockResolvedValue({ _sum: { xpAwarded: 100 } } as never);

      const response = await request(app)
        .post('/api/v1/tasks/task-1/complete')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.xpAwarded).toBeGreaterThan(0);
      expect(response.body.meta.progress).toBeDefined();
    });

    it('should reject completing an already completed task', async () => {
      prismaMock.task.findFirst.mockResolvedValue({
        ...sampleTask,
        status: 'COMPLETED' as const,
      });

      const response = await request(app)
        .post('/api/v1/tasks/task-1/complete')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('TASK_ALREADY_COMPLETED');
    });

    it('should return 404 for non-existent task', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/tasks/nonexistent/complete')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
    });
  });
});
