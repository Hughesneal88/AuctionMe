import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User.model';

describe('User Profile API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/auctionme-test');
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create and login a verified user
    const user = await User.create({
      email: 'test@university.edu',
      password: 'password123',
      name: 'Test User',
      isVerified: true,
    });
    userId = user._id.toString();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@university.edu',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', 'test@university.edu');
      expect(response.body.user).toHaveProperty('name', 'Test User');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          phone: '1234567890',
          campusLocation: 'Building A, Room 101',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('updated');
      expect(response.body.user.name).toBe('Updated Name');
      expect(response.body.user.phone).toBe('1234567890');
      expect(response.body.user.campusLocation).toBe('Building A, Room 101');
    });

    it('should partially update user profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '9876543210',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.phone).toBe('9876543210');
      expect(response.body.user.name).toBe('Test User'); // Original name unchanged
    });
  });
});
