import { Request, Response } from 'express';
import { ConfirmationCodeService } from '../services/confirmationCodeService';

export class DeliveryController {
  /**
   * Generate delivery confirmation code for buyer
   * POST /api/delivery/generate
   * Body: { transactionId: string, buyerId: string }
   */
  static async generateConfirmationCode(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId, buyerId } = req.body;

      if (!transactionId || !buyerId) {
        res.status(400).json({
          success: false,
          message: 'transactionId and buyerId are required',
        });
        return;
      }

      const result = await ConfirmationCodeService.createDeliveryConfirmation(
        transactionId,
        buyerId
      );

      res.status(201).json({
        success: true,
        message: 'Confirmation code generated successfully',
        data: {
          code: result.code, // Only shown once to buyer
          confirmationId: result.confirmation.id,
          expiresAt: result.confirmation.expiresAt,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Confirm delivery with confirmation code (seller action)
   * POST /api/delivery/confirm
   * Body: { transactionId: string, code: string, sellerId: string }
   */
  static async confirmDelivery(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId, code, sellerId } = req.body;

      if (!transactionId || !code || !sellerId) {
        res.status(400).json({
          success: false,
          message: 'transactionId, code, and sellerId are required',
        });
        return;
      }

      // Validate code format (6 digits)
      if (!/^\d{6}$/.test(code)) {
        res.status(400).json({
          success: false,
          message: 'Invalid code format. Code must be 6 digits',
        });
        return;
      }

      const result = await ConfirmationCodeService.confirmDelivery(
        transactionId,
        code,
        sellerId
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: `Server error: ${message}`,
      });
    }
  }

  /**
   * Get confirmation status (buyer only)
   * GET /api/delivery/status/:transactionId
   * Query: buyerId
   */
  static async getConfirmationStatus(req: Request, res: Response): Promise<void> {
    try {
      const transactionId = req.params.transactionId as string;
      const buyerId = req.query.buyerId;

      if (!transactionId || !buyerId || typeof buyerId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'transactionId and buyerId are required',
        });
        return;
      }

      const confirmation = ConfirmationCodeService.getConfirmationDetails(
        transactionId,
        buyerId
      );

      if (!confirmation) {
        res.status(404).json({
          success: false,
          message: 'Confirmation not found or access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: confirmation,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: `Server error: ${message}`,
      });
    }
  }
}
