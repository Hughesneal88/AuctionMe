import { Request, Response } from 'express';
import { deliveryCodeService } from '../services/DeliveryCodeService';

/**
 * Controller for delivery code endpoints
 */
export class DeliveryCodeController {
  /**
   * Generate a delivery code for an auction
   */
  async generateCode(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { auctionId, buyerId, sellerId, expiresInHours } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!auctionId || !buyerId || !sellerId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const deliveryCode = await deliveryCodeService.generateCode(
        auctionId,
        buyerId,
        sellerId,
        expiresInHours
      );

      // Only return code to buyer, not seller
      const response = userId === buyerId 
        ? deliveryCode 
        : { ...deliveryCode, code: '******' };

      return res.status(201).json({ deliveryCode: response });
    } catch (error) {
      console.error('Generate code error:', error);
      return res.status(500).json({ error: 'Failed to generate delivery code' });
    }
  }

  /**
   * Verify a delivery code
   */
  async verifyCode(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { deliveryCodeId } = req.params;
      const { code } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const result = await deliveryCodeService.verifyCode(
        deliveryCodeId,
        code,
        userId,
        req.ip,
        req.get('user-agent')
      );

      if (!result.success) {
        return res.status(400).json({
          error: 'Verification failed',
          reason: result.reason,
        });
      }

      return res.json({
        message: 'Delivery code verified successfully',
        deliveryCode: result.deliveryCode,
      });
    } catch (error) {
      console.error('Verify code error:', error);
      return res.status(500).json({ error: 'Failed to verify delivery code' });
    }
  }

  /**
   * Get delivery code by auction ID
   */
  async getByAuctionId(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { auctionId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const deliveryCode = await deliveryCodeService.getByAuctionId(auctionId);

      if (!deliveryCode) {
        return res.status(404).json({ error: 'Delivery code not found' });
      }

      // Hide code from seller
      const response = userId === deliveryCode.buyerId 
        ? deliveryCode 
        : { ...deliveryCode, code: '******' };

      return res.json({ deliveryCode: response });
    } catch (error) {
      console.error('Get delivery code error:', error);
      return res.status(500).json({ error: 'Failed to fetch delivery code' });
    }
  }

  /**
   * Check if delivery code is valid
   */
  async checkValidity(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { deliveryCodeId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const isValid = await deliveryCodeService.isValid(deliveryCodeId);

      return res.json({ isValid });
    } catch (error) {
      console.error('Check validity error:', error);
      return res.status(500).json({ error: 'Failed to check validity' });
    }
  }
}

export const deliveryCodeController = new DeliveryCodeController();
