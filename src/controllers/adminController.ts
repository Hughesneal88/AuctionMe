import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import disputeService from '../services/disputeService';
import escrowService from '../services/escrowService';
import adminService from '../services/adminService';
import auditLogService from '../services/auditLogService';
import { DisputeStatus, DisputeResolution, AuditAction } from '../types/enums';
import mongoose from 'mongoose';

class AdminController {
  /**
   * Get all disputes (admin view)
   * GET /api/admin/disputes
   */
  async getAllDisputes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, page, limit } = req.query;

      const filters: any = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      };

      if (status) {
        filters.status = status;
      }

      const result = await disputeService.getDisputes(filters);

      res.json({
        disputes: result.disputes,
        pagination: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(result.total / filters.limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get a specific dispute (admin view)
   * GET /api/admin/disputes/:id
   */
  async getDisputeById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const dispute = await disputeService.getDisputeById(
        new mongoose.Types.ObjectId(id as string)
      );

      if (!dispute) {
        res.status(404).json({ error: 'Dispute not found' });
        return;
      }

      res.json({ dispute });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark dispute as under review
   * PUT /api/admin/disputes/:id/review
   */
  async markDisputeUnderReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const dispute = await disputeService.markDisputeUnderReview(
        new mongoose.Types.ObjectId(id as string),
        req.user._id
      );

      res.json({
        message: 'Dispute marked as under review',
        dispute
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Resolve a dispute
   * POST /api/admin/disputes/:id/resolve
   */
  async resolveDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolution, resolutionNote } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!resolution || !resolutionNote) {
        res.status(400).json({ 
          error: 'Missing required fields: resolution, resolutionNote' 
        });
        return;
      }

      // Validate resolution
      if (!Object.values(DisputeResolution).includes(resolution)) {
        res.status(400).json({ 
          error: 'Invalid resolution',
          validResolutions: Object.values(DisputeResolution)
        });
        return;
      }

      const dispute = await disputeService.resolveDispute({
        disputeId: new mongoose.Types.ObjectId(id as string),
        resolution,
        resolutionNote,
        reviewedBy: req.user._id
      });

      res.json({
        message: 'Dispute resolved successfully',
        dispute
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Manually release escrow to seller
   * POST /api/admin/escrow/:id/release
   */
  async releaseEscrow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const escrow = await escrowService.releaseEscrow(
        new mongoose.Types.ObjectId(id as string),
        req.user._id,
        note
      );

      res.json({
        message: 'Escrow released successfully',
        escrow
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Manually refund escrow to buyer
   * POST /api/admin/escrow/:id/refund
   */
  async refundEscrow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const escrow = await escrowService.refundEscrow(
        new mongoose.Types.ObjectId(id as string),
        req.user._id,
        note
      );

      res.json({
        message: 'Escrow refunded successfully',
        escrow
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Suspend a user
   * POST /api/admin/users/:id/suspend
   */
  async suspendUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { durationDays, reason } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!durationDays || !reason) {
        res.status(400).json({ 
          error: 'Missing required fields: durationDays, reason' 
        });
        return;
      }

      if (durationDays <= 0) {
        res.status(400).json({ error: 'Duration must be positive' });
        return;
      }

      const user = await adminService.suspendUser({
        userId: new mongoose.Types.ObjectId(id as string),
        suspendedBy: req.user._id,
        durationDays,
        reason
      });

      res.json({
        message: 'User suspended successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status,
          suspendedUntil: user.suspendedUntil,
          suspensionReason: user.suspensionReason
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Unsuspend a user
   * POST /api/admin/users/:id/unsuspend
   */
  async unsuspendUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = await adminService.unsuspendUser(
        new mongoose.Types.ObjectId(id as string),
        req.user._id
      );

      res.json({
        message: 'User unsuspended successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Ban a user
   * POST /api/admin/users/:id/ban
   */
  async banUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!reason) {
        res.status(400).json({ error: 'Reason is required' });
        return;
      }

      const user = await adminService.banUser({
        userId: new mongoose.Types.ObjectId(id as string),
        bannedBy: req.user._id,
        reason
      });

      res.json({
        message: 'User banned successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status,
          suspensionReason: user.suspensionReason
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get audit logs
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { action, performedBy, targetUser, startDate, endDate, page, limit } = req.query;

      const filters: any = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50
      };

      if (action) {
        filters.action = action as AuditAction;
      }

      if (performedBy) {
        filters.performedBy = new mongoose.Types.ObjectId(performedBy as string);
      }

      if (targetUser) {
        filters.targetUser = new mongoose.Types.ObjectId(targetUser as string);
      }

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const result = await auditLogService.getAuditLogs(filters);

      res.json({
        logs: result.logs,
        pagination: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(result.total / filters.limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get audit logs for a specific resource
   * GET /api/admin/audit-logs/resource/:type/:id
   */
  async getResourceAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, id } = req.params;

      const logs = await auditLogService.getResourceLogs(
        type as string,
        new mongoose.Types.ObjectId(id as string)
      );

      res.json({ logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AdminController();
