import request from 'supertest';
import { Application } from 'express';
import '../setup';

declare const testApp: Application;

describe('Query Endpoints', () => {
  describe('POST /query', () => {
    it('should handle missing query parameter', async () => {
      const invalidData = {};

      const response = await request(testApp)
        .post('/query')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing query in request body');
    });

    it('should handle authentication errors gracefully', async () => {
      const queryData = {
        query: 'test query'
      };

      const response = await request(testApp)
        .post('/query')
        .send(queryData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('should reject GET requests', async () => {
      const response = await request(testApp)
        .get('/query')
        .expect('Content-Type', /json/)
        .expect(405);

      expect(response.body).toHaveProperty('error', 'Method not allowed');
    });
  });
}); 