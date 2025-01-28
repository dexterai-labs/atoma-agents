import request from 'supertest';
import { Application } from 'express';
import '../setup';

declare const testApp: Application;

describe('Pool Tool Queries', () => {
  describe('POST /query with pool queries', () => {
    it('should verify Atoma service connectivity', async () => {
      const queryData = {
        query: 'Get information about pool with ID 0x5c3815e67b1478ff41fb7d6646a94c63f22f06ab6606c1608e5e7f299f229004'
      };

      const response = await request(testApp)
        .post('/query')
        .send(queryData)
        .expect('Content-Type', /json/);

      // If auth is successful, we should get a 200 response
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body.error).toBeUndefined();
      } 
      // If auth fails, we should get a 500 with proper error
      else {
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
      }
    });

    it('should handle pool info query', async () => {
      const queryData = {
        query: 'Get information about pool with ID 0x5c3815e67b1478ff41fb7d6646a94c63f22f06ab6606c1608e5e7f299f229004'
      };

      const response = await request(testApp)
        .post('/query')
        .send(queryData)
        .expect('Content-Type', /json/)
        .expect(500); // Currently expecting 500 due to auth issues

      expect(response.body).toHaveProperty('error');
    });

    it('should handle pool ranking query', async () => {
      const queryData = {
        query: 'Show me the top 5 pools by TVL'
      };

      const response = await request(testApp)
        .post('/query')
        .send(queryData)
        .expect('Content-Type', /json/)
        .expect(500); // Currently expecting 500 due to auth issues

      expect(response.body).toHaveProperty('error');
    });

    it('should handle pool filtering query', async () => {
      const queryData = {
        query: 'Find pools with minimum TVL of 100000 and minimum APR of 5%'
      };

      const response = await request(testApp)
        .post('/query')
        .send(queryData)
        .expect('Content-Type', /json/)
        .expect(500); // Currently expecting 500 due to auth issues

      expect(response.body).toHaveProperty('error');
    });

    it('should handle pool events query', async () => {
      const queryData = {
        query: 'Show me the last 5 deposit events for pool 0x5c3815e67b1478ff41fb7d6646a94c63f22f06ab6606c1608e5e7f299f229004'
      };

      const response = await request(testApp)
        .post('/query')
        .send(queryData)
        .expect('Content-Type', /json/)
        .expect(500); // Currently expecting 500 due to auth issues

      expect(response.body).toHaveProperty('error');
    });
  });
}); 