import { Router } from 'express';
import disputeController from '../controllers/disputeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All dispute routes require authentication
router.use(authenticate);

// Buyer dispute creation and management
router.post('/', disputeController.createDispute);
router.get('/', disputeController.getDisputes);
router.get('/:id', disputeController.getDisputeById);
router.post('/:id/evidence', disputeController.addEvidence);

export default router;
