import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import exampleRoutes from './example.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/marketplace', exampleRoutes);

export default router;
