import request from 'supertest';
import express from 'express';
import routes from '../../routes';
import { config } from '../../config/env';

describe('API Root Endpoint', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(`/api/${config.apiVersion}`, routes);
  });

  describe('GET /api/v1/', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/api/v1/');
      expect(response.status).toBe(200);
    });

    it('should return success: true', async () => {
      const response = await request(app).get('/api/v1/');
      expect(response.body.success).toBe(true);
    });

    it('should include API message', async () => {
      const response = await request(app).get('/api/v1/');
      expect(response.body.message).toBe('Systemize API');
    });

    it('should include version', async () => {
      const response = await request(app).get('/api/v1/');
      expect(response.body.version).toBeDefined();
    });

    it('should list available endpoints', async () => {
      const response = await request(app).get('/api/v1/');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints.auth).toBe('/auth');
      expect(response.body.endpoints.tasks).toBe('/tasks');
      expect(response.body.endpoints.progress).toBe('/progress');
      expect(response.body.endpoints.notifications).toBe('/notifications');
    });
  });
});
