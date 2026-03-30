import request from 'supertest';
import express from 'express';
import routes from '../../routes';
import { config } from '../../config/env';
import { generateTestToken } from '../helpers/testUtils';
import { errorHandler } from '../../middleware/errorHandler';
import prisma from '../../lib/db';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Progress Routes', () => {
  let app: express.Application;
  let validToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(`/api/${config.apiVersion}`, routes);
    app.use(errorHandler);
    validToken = generateTestToken();
  });

  describe('GET /api/v1/progress', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/progress');
      expect(response.status).toBe(401);
    });

    it('should return progress data', async () => {
      prismaMock.userProgress.findUnique.mockResolvedValue({
        id: 'prog-1', userId: 'test-user-id', totalXP: 850, currentLevel: 2,
        currentStreak: 5, longestStreak: 7, lastActivityAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalXP).toBe(850);
      expect(response.body.data.currentLevel).toBe(2);
      expect(response.body.data.xpToNextLevel).toBeDefined();
      expect(response.body.data.levelProgress).toBeDefined();
    });

    it('should return defaults for new user', async () => {
      prismaMock.userProgress.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalXP).toBe(0);
      expect(response.body.data.currentLevel).toBe(1);
    });
  });

  describe('GET /api/v1/progress/badges', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/progress/badges');
      expect(response.status).toBe(401);
    });

    it('should return badges with earned status', async () => {
      prismaMock.userBadge.findMany.mockResolvedValue([]);
      prismaMock.badge.findMany.mockResolvedValue([
        { id: 'b1', name: 'First Steps', description: 'Complete first task', icon: '🎯', category: 'milestone', xpRequired: null, criteria: null, createdAt: new Date() },
      ]);

      const response = await request(app)
        .get('/api/v1/progress/badges')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].earned).toBe(false);
    });
  });

  describe('GET /api/v1/progress/stats', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/progress/stats');
      expect(response.status).toBe(401);
    });

    it('should return completion stats', async () => {
      prismaMock.task.count.mockResolvedValueOnce(50); // total
      prismaMock.task.count.mockResolvedValueOnce(20); // completed
      prismaMock.task.aggregate.mockResolvedValue({ _sum: { xpAwarded: 2500 }, _count: 0, _avg: { xpAwarded: 0 }, _min: { xpAwarded: 0 }, _max: { xpAwarded: 0 } } as never);
      prismaMock.task.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/progress/stats')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalTasks).toBe(50);
      expect(response.body.data.completedTasks).toBe(20);
      expect(response.body.data.completionRate).toBe(40);
    });
  });
});
