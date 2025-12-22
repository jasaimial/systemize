import request from 'supertest';
import express from 'express';
import routes from '../../routes';
import { config } from '../../config/env';
import { generateTestToken } from '../helpers/testUtils';

describe('Task Routes', () => {
  let app: express.Application;
  let validToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(`/api/${config.apiVersion}`, routes);
    validToken = generateTestToken();
  });

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

  describe('GET /api/v1/tasks', () => {
    it('should return placeholder with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should return placeholder with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test task',
          category: 'HOMEWORK',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/tasks/upcoming', () => {
    it('should return placeholder with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/upcoming')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/tasks/overdue', () => {
    it('should return placeholder with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/overdue')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    it('should return placeholder with valid token', async () => {
      const response = await request(app)
        .put('/api/v1/tasks/123')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated task' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should return placeholder with valid token', async () => {
      const response = await request(app)
        .delete('/api/v1/tasks/123')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/tasks/:id/complete', () => {
    it('should return placeholder with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/tasks/123/complete')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
