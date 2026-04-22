import request from 'supertest';
import app from '../src/app';

describe('Trip API', () => {
  it('should return health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  // Add more tests as needed
});
