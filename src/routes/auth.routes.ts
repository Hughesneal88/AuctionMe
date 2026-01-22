import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/verify-email', (req, res) => authController.verifyEmail(req, res));
router.post('/resend-verification', (req, res) => authController.resendVerification(req, res));
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));

// Protected routes (require authentication)
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.get('/me', authenticate, (req, res) => authController.getCurrentUser(req, res));

export default router;
