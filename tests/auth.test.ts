import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User.model';

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/auctionme-test');
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid campus email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@university.edu',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@university.edu');
      expect(response.body.user.isVerified).toBe(false);
    });

    it('should reject registration with non-campus email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@gmail.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@university.edu',
          password: '123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least 6 characters');
    });

    it('should reject duplicate email registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@university.edu',
          password: 'password123',
          name: 'Test User',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@university.edu',
          password: 'password456',
          name: 'Another User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should not allow login before email verification', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@university.edu',
          password: 'password123',
          name: 'Test User',
        });

      // Try to login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@university.edu',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('verify your email');
    });

    it('should allow login after email verification', async () => {
      // Create and verify user manually
      const user = await User.create({
        email: 'test@university.edu',
        password: 'password123',
        name: 'Test User',
        isVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@university.edu',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject login with wrong password', async () => {
      await User.create({
        email: 'test@university.edu',
        password: 'password123',
        name: 'Test User',
        isVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@university.edu',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      // Create and verify user
      const user = await User.create({
        email: 'test@university.edu',
        password: 'password123',
        name: 'Test User',
        isVerified: true,
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@university.edu',
          password: 'password123',
        });

      const token = loginResponse.body.accessToken;

      // Get current user
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@university.edu');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('No token');
    });
  });
});
