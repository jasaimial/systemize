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

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(`/api/${config.apiVersion}`, routes);
    app.use(errorHandler);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with name and return token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test.kid@systemize.local',
        name: 'Test Kid',
        avatarUrl: null,
        provider: 'local',
        providerId: 'local-test.kid',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.user.upsert.mockResolvedValue(mockUser);
      prismaMock.userProgress.upsert.mockResolvedValue({
        id: 'prog-1', userId: 'user-1', totalXP: 0, currentLevel: 1,
        currentStreak: 0, longestStreak: 0, lastActivityAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ name: 'Test Kid' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.name).toBe('Test Kid');
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ name: '' });

      expect(response.status).toBe(400);
    });

    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 with valid token', async () => {
      const token = generateTestToken();
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return user profile with valid token', async () => {
      const token = generateTestToken();
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        provider: 'google',
        providerId: 'google-test',
        createdAt: new Date(),
        updatedAt: new Date(),
        // @ts-expect-error - mock includes
        progress: { totalXP: 100, currentLevel: 1, currentStreak: 3, longestStreak: 5 },
        userBadges: [],
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test User');
    });
  });
});
