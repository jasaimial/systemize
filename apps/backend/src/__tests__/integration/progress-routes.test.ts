import request from 'supertest';
import express from 'express';
import routes from '../../routes';
import { config } from '../../config/env';
import { generateTestToken } from '../helpers/testUtils';

describe('Progress Routes', () => {
  let app: express.Application;
  let validToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(`/api/${config.apiVersion}`, routes);
    validToken = generateTestToken();
  });

  describe('Authentication Required', () => {
    it('GET /api/v1/progress should require authentication', async () => {
      const response = await request(app).get('/api/v1/progress');
      expect(response.status).toBe(401);
    });

    it('GET /api/v1/progress/badges should require authentication', async () => {
      const response = await request(app).get('/api/v1/progress/badges');
      expect(response.status).toBe(401);
    });

    it('GET /api/v1/progress/stats should require authentication', async () => {
      const response = await request(app).get('/api/v1/progress/stats');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/progress', () => {
    it('should return placeholder progress data with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        totalXP: 0,
        currentLevel: 1,
        currentStreak: 0,
        longestStreak: 0,
      });
    });
  });

  describe('GET /api/v1/progress/badges', () => {
    it('should return placeholder badges with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/progress/badges')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/progress/stats', () => {
    it('should return placeholder stats with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/progress/stats')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        completionRate: 0,
        totalTasks: 0,
        completedTasks: 0,
      });
    });
  });
});
