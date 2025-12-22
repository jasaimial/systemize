import request from 'supertest';
import express from 'express';
import routes from '../../routes';
import { config } from '../../config/env';
import { generateTestToken } from '../helpers/testUtils';
import { errorHandler } from '../../middleware/errorHandler';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(`/api/${config.apiVersion}`, routes);
    app.use(errorHandler); // Add error handler middleware
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should return 200 with placeholder message', async () => {
      const response = await request(app).post('/api/v1/auth/signup');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('to be implemented');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 with placeholder message', async () => {
      const response = await request(app).post('/api/v1/auth/login');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('to be implemented');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
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
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 with valid token', async () => {
      const token = generateTestToken();
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 200 with placeholder message', async () => {
      const response = await request(app).post('/api/v1/auth/refresh');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('to be implemented');
    });
  });
});
