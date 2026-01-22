import { Request, Response } from 'express';
import userService from '../services/user.service';
import { sanitizeUser } from '../utils/validation.utils';

export class UserController {
  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = await userService.getProfile(userId);

      res.status(200).json({ user: sanitizeUser(user) });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { name, phone, campusLocation } = req.body;

      const user = await userService.updateProfile(userId, {
        name,
        phone,
        campusLocation,
      });

      res.status(200).json({
        message: 'Profile updated successfully',
        user: sanitizeUser(user),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new UserController();
