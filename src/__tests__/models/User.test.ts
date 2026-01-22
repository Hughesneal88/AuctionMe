import mongoose from 'mongoose';
import User from '../../models/User';
import { UserRole, UserStatus } from '../../types/enums';

describe('User Model', () => {
  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auctionme_test';
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a new user with default values', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });

      await user.save();

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe(UserRole.BUYER);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should create an admin user', async () => {
      const user = new User({
        email: 'admin@example.com',
        password: 'hashedpassword',
        name: 'Admin User',
        role: UserRole.ADMIN
      });

      await user.save();

      expect(user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('User Status', () => {
    it('should check if active user is active', async () => {
      const user = new User({
        email: 'active@example.com',
        password: 'hashedpassword',
        name: 'Active User',
        status: UserStatus.ACTIVE
      });

      await user.save();

      expect(user.isActive()).toBe(true);
    });

    it('should check if suspended user with future date is not active', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const user = new User({
        email: 'suspended@example.com',
        password: 'hashedpassword',
        name: 'Suspended User',
        status: UserStatus.SUSPENDED,
        suspendedUntil: futureDate
      });

      await user.save();

      expect(user.isActive()).toBe(false);
    });

    it('should check if suspended user with past date is active', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const user = new User({
        email: 'expired@example.com',
        password: 'hashedpassword',
        name: 'Expired Suspension User',
        status: UserStatus.SUSPENDED,
        suspendedUntil: pastDate
      });

      await user.save();

      expect(user.isActive()).toBe(true);
    });
  });
});
