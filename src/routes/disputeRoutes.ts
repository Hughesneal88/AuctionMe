import { Router } from 'express';
import disputeController from '../controllers/disputeController';
import { authenticate } from '../middleware/auth';
import { apiLimiter, disputeCreationLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting
router.use(apiLimiter);

// All dispute routes require authentication
router.use(authenticate);

// Buyer dispute creation and management
router.post('/', disputeCreationLimiter, disputeController.createDispute);
router.get('/', disputeController.getDisputes);
router.get('/:id', disputeController.getDisputeById);
router.post('/:id/evidence', disputeController.addEvidence);

export default router;
