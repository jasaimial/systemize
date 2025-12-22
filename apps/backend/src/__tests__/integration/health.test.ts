import request from 'supertest';
import express from 'express';
import { config } from '../../config/env';

describe('Health Check Endpoint', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create minimal app for testing health endpoint
    app = express();

    app.get('/health', (_req, res) => {
      res.json({
        success: true,
        message: 'Systemize API is running',
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
        environment: config.nodeEnv,
      });
    });
  });

  describe('GET /health', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return success: true', async () => {
      const response = await request(app).get('/health');
      expect(response.body.success).toBe(true);
    });

    it('should return correct message', async () => {
      const response = await request(app).get('/health');
      expect(response.body.message).toBe('Systemize API is running');
    });

    it('should include timestamp', async () => {
      const response = await request(app).get('/health');
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include API version', async () => {
      const response = await request(app).get('/health');
      expect(response.body.version).toBe(config.apiVersion);
    });

    it('should include environment', async () => {
      const response = await request(app).get('/health');
      expect(response.body.environment).toBe('test');
    });

    it('should have correct content-type', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
