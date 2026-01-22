import { Request, Response } from 'express';
import { auditService } from '../services/AuditService';
import { AuditAction } from '../types';

/**
 * Controller for audit log endpoints
 */
export class AuditController {
  /**
   * Get audit logs for the authenticated user
   */
  async getUserLogs(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const logs = await auditService.getByUserId(userId);

      return res.json({
        logs,
        total: logs.length,
      });
    } catch (error) {
      console.error('Get user logs error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  /**
   * Get recent audit logs (admin only - would need auth check)
   */
  async getRecentLogs(req: Request, res: Response) {
    try {
      // In production, check if user is admin
      const isAdmin = (req as any).user?.isAdmin || false;

      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await auditService.getRecent(limit);

      return res.json({
        logs,
        total: logs.length,
      });
    } catch (error) {
      console.error('Get recent logs error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  /**
   * Get high severity logs (admin only)
   */
  async getHighSeverityLogs(req: Request, res: Response) {
    try {
      const isAdmin = (req as any).user?.isAdmin || false;

      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
      }

      const logs = await auditService.getHighSeverityLogs();

      return res.json({
        logs,
        total: logs.length,
      });
    } catch (error) {
      console.error('Get high severity logs error:', error);
      return res.status(500).json({ error: 'Failed to fetch high severity logs' });
    }
  }

  /**
   * Get logs by action type
   */
  async getLogsByAction(req: Request, res: Response) {
    try {
      const { action } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate action
      if (!Object.values(AuditAction).includes(action as AuditAction)) {
        return res.status(400).json({ error: 'Invalid action type' });
      }

      const logs = await auditService.getByAction(action as AuditAction);
      
      // Filter to user's own logs unless admin
      const isAdmin = (req as any).user?.isAdmin || false;
      const filteredLogs = isAdmin ? logs : logs.filter(log => log.userId === userId);

      return res.json({
        logs: filteredLogs,
        total: filteredLogs.length,
      });
    } catch (error) {
      console.error('Get logs by action error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  /**
   * Get logs for a specific resource
   */
  async getResourceLogs(req: Request, res: Response) {
    try {
      const { resource, resourceId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const logs = await auditService.getByResource(resource, resourceId);
      
      // Filter to user's own logs unless admin
      const isAdmin = (req as any).user?.isAdmin || false;
      const filteredLogs = isAdmin ? logs : logs.filter(log => log.userId === userId);

      return res.json({
        logs: filteredLogs,
        total: filteredLogs.length,
      });
    } catch (error) {
      console.error('Get resource logs error:', error);
      return res.status(500).json({ error: 'Failed to fetch resource logs' });
    }
  }
}

export const auditController = new AuditController();
