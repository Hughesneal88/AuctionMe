import AuditLog, { IAuditLog } from '../models/AuditLog';
import { AuditAction } from '../types/enums';
import mongoose from 'mongoose';

export interface CreateAuditLogParams {
  action: AuditAction;
  performedBy: mongoose.Types.ObjectId;
  targetUser?: mongoose.Types.ObjectId;
  targetResource?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogService {
  /**
   * Create a new audit log entry
   */
  async createLog(params: CreateAuditLogParams): Promise<IAuditLog> {
    const auditLog = new AuditLog(params);
    await auditLog.save();
    return auditLog;
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    action?: AuditAction;
    performedBy?: mongoose.Types.ObjectId;
    targetUser?: mongoose.Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: IAuditLog[]; total: number }> {
    const query: any = {};

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.performedBy) {
      query.performedBy = filters.performedBy;
    }

    if (filters.targetUser) {
      query.targetUser = filters.targetUser;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name email')
        .populate('targetUser', 'name email'),
      AuditLog.countDocuments(query)
    ]);

    return { logs, total };
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceLogs(
    resourceType: string,
    resourceId: mongoose.Types.ObjectId
  ): Promise<IAuditLog[]> {
    return AuditLog.find({
      'targetResource.type': resourceType,
      'targetResource.id': resourceId
    })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email');
  }
}

export default new AuditLogService();
