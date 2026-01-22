import mongoose from 'mongoose';
import adminService from '../../services/adminService';
import User from '../../models/User';
import { UserStatus, UserRole } from '../../types/enums';

describe('AdminService', () => {
  let user: any;
  let admin: any;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auctionme_test';
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    user = await User.create({
      email: 'user@example.com',
      password: 'password',
      name: 'Test User',
      role: UserRole.BUYER
    });

    admin = await User.create({
      email: 'admin@example.com',
      password: 'password',
      name: 'Admin User',
      role: UserRole.ADMIN
    });
  });

  describe('suspendUser', () => {
    it('should suspend a user successfully', async () => {
      const suspended = await adminService.suspendUser({
        userId: user._id,
        suspendedBy: admin._id,
        durationDays: 7,
        reason: 'Violation of terms'
      });

      expect(suspended.status).toBe(UserStatus.SUSPENDED);
      expect(suspended.suspensionReason).toBe('Violation of terms');
      expect(suspended.suspendedUntil).toBeDefined();

      // Check the suspension date is approximately 7 days from now
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);
      const diff = Math.abs(suspended.suspendedUntil!.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000); // Within 1 second
    });

    it('should throw error if user not found', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      await expect(
        adminService.suspendUser({
          userId: fakeUserId,
          suspendedBy: admin._id,
          durationDays: 7,
          reason: 'Test'
        })
      ).rejects.toThrow('User not found');
    });
  });

  describe('unsuspendUser', () => {
    beforeEach(async () => {
      await adminService.suspendUser({
        userId: user._id,
        suspendedBy: admin._id,
        durationDays: 7,
        reason: 'Test suspension'
      });
    });

    it('should unsuspend a user successfully', async () => {
      const unsuspended = await adminService.unsuspendUser(user._id, admin._id);

      expect(unsuspended.status).toBe(UserStatus.ACTIVE);
      expect(unsuspended.suspendedUntil).toBeUndefined();
      expect(unsuspended.suspensionReason).toBeUndefined();
    });

    it('should throw error if user is not suspended', async () => {
      await adminService.unsuspendUser(user._id, admin._id);

      await expect(
        adminService.unsuspendUser(user._id, admin._id)
      ).rejects.toThrow('User is not suspended');
    });
  });

  describe('banUser', () => {
    it('should ban a user successfully', async () => {
      const banned = await adminService.banUser({
        userId: user._id,
        bannedBy: admin._id,
        reason: 'Serious violation'
      });

      expect(banned.status).toBe(UserStatus.BANNED);
      expect(banned.suspensionReason).toBe('Serious violation');
    });

    it('should throw error if user already banned', async () => {
      await adminService.banUser({
        userId: user._id,
        bannedBy: admin._id,
        reason: 'Test ban'
      });

      await expect(
        adminService.banUser({
          userId: user._id,
          bannedBy: admin._id,
          reason: 'Another ban'
        })
      ).rejects.toThrow('User is already banned');
    });
  });

  describe('getUsers', () => {
    beforeEach(async () => {
      await User.create([
        {
          email: 'user1@example.com',
          password: 'password',
          name: 'User 1',
          role: UserRole.BUYER
        },
        {
          email: 'user2@example.com',
          password: 'password',
          name: 'User 2',
          role: UserRole.SELLER,
          status: UserStatus.SUSPENDED
        }
      ]);
    });

    it('should get all users', async () => {
      const result = await adminService.getUsers({});

      expect(result.users.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter users by status', async () => {
      const result = await adminService.getUsers({
        status: UserStatus.SUSPENDED
      });

      expect(result.users.length).toBeGreaterThan(0);
      result.users.forEach((u) => {
        expect(u.status).toBe(UserStatus.SUSPENDED);
      });
    });
  });
});
