import { Router } from 'express';
import { auditController } from '../controllers/AuditController';

const router = Router();

/**
 * Audit log routes
 * All routes require authentication
 */

// Get audit logs for the authenticated user
router.get(
  '/user',
  auditController.getUserLogs.bind(auditController)
);

// Get recent logs (admin only)
router.get(
  '/recent',
  auditController.getRecentLogs.bind(auditController)
);

// Get high severity logs (admin only)
router.get(
  '/high-severity',
  auditController.getHighSeverityLogs.bind(auditController)
);

// Get logs by action type
router.get(
  '/action/:action',
  auditController.getLogsByAction.bind(auditController)
);

// Get logs for a specific resource
router.get(
  '/resource/:resource/:resourceId',
  auditController.getResourceLogs.bind(auditController)
);

export const auditRoutes = router;
