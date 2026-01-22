import { Router } from 'express';
import adminController from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dispute management
router.get('/disputes', adminController.getAllDisputes);
router.get('/disputes/:id', adminController.getDisputeById);
router.put('/disputes/:id/review', adminController.markDisputeUnderReview);
router.post('/disputes/:id/resolve', adminController.resolveDispute);

// Escrow management
router.post('/escrow/:id/release', adminController.releaseEscrow);
router.post('/escrow/:id/refund', adminController.refundEscrow);

// User management
router.post('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/unsuspend', adminController.unsuspendUser);
router.post('/users/:id/ban', adminController.banUser);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/resource/:type/:id', adminController.getResourceAuditLogs);

export default router;
