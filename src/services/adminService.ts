import User, { IUser } from '../models/User';
import { UserStatus, AuditAction } from '../types/enums';
import auditLogService from './auditLogService';
import mongoose from 'mongoose';

export interface SuspendUserParams {
  userId: mongoose.Types.ObjectId;
  suspendedBy: mongoose.Types.ObjectId;
  durationDays: number;
  reason: string;
}

export interface BanUserParams {
  userId: mongoose.Types.ObjectId;
  bannedBy: mongoose.Types.ObjectId;
  reason: string;
}

class AdminService {
  /**
   * Suspend a user temporarily
   */
  async suspendUser(params: SuspendUserParams): Promise<IUser> {
    const user = await User.findById(params.userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === UserStatus.BANNED) {
      throw new Error('Cannot suspend a banned user');
    }

    // Calculate suspension end date
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + params.durationDays);

    user.status = UserStatus.SUSPENDED;
    user.suspendedUntil = suspendedUntil;
    user.suspensionReason = params.reason;
    await user.save();

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.USER_SUSPENDED,
      performedBy: params.suspendedBy,
      targetUser: user._id,
      details: {
        durationDays: params.durationDays,
        suspendedUntil,
        reason: params.reason
      }
    });

    return user;
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(
    userId: mongoose.Types.ObjectId,
    unsuspendedBy: mongoose.Types.ObjectId
  ): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== UserStatus.SUSPENDED) {
      throw new Error('User is not suspended');
    }

    user.status = UserStatus.ACTIVE;
    user.suspendedUntil = undefined;
    user.suspensionReason = undefined;
    await user.save();

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.USER_UNSUSPENDED,
      performedBy: unsuspendedBy,
      targetUser: user._id,
      details: {
        previousSuspensionReason: user.suspensionReason
      }
    });

    return user;
  }

  /**
   * Ban a user permanently
   */
  async banUser(params: BanUserParams): Promise<IUser> {
    const user = await User.findById(params.userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === UserStatus.BANNED) {
      throw new Error('User is already banned');
    }

    user.status = UserStatus.BANNED;
    user.suspensionReason = params.reason;
    user.suspendedUntil = undefined;
    await user.save();

    // Create audit log
    await auditLogService.createLog({
      action: AuditAction.USER_BANNED,
      performedBy: params.bannedBy,
      targetUser: user._id,
      details: {
        reason: params.reason
      }
    });

    return user;
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: mongoose.Types.ObjectId): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Get all users with filtering
   */
  async getUsers(filters: {
    status?: UserStatus;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: IUser[]; total: number }> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.role) {
      query.role = filters.role;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return { users, total };
  }
}

export default new AdminService();
