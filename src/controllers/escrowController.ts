import { Request, Response } from 'express';
import escrowService from '../services/escrowService';

/**
 * Controller for escrow-related endpoints
 */
export class EscrowController {
  /**
   * Get escrow status
   * GET /api/escrow/:escrowId/status
   */
  async getEscrowStatus(req: Request, res: Response): Promise<void> {
    try {
      const escrowId = req.params.escrowId as string;

      const escrow = await escrowService.getEscrowStatus(escrowId);

      if (!escrow) {
        res.status(404).json({
          success: false,
          error: 'Escrow not found'
        });
        return;
      }

      // Don't expose the hashed delivery code
      const escrowData = escrow.toObject();
      delete escrowData.deliveryCode;

      res.status(200).json({
        success: true,
        data: escrowData
      });
    } catch (error: any) {
      console.error('Error fetching escrow status:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get escrow by transaction ID
   * GET /api/escrow/transaction/:transactionId
   */
  async getEscrowByTransaction(req: Request, res: Response): Promise<void> {
    try {
      const transactionId = req.params.transactionId as string;

      const escrow = await escrowService.getEscrowByTransaction(transactionId);

      if (!escrow) {
        res.status(404).json({
          success: false,
          error: 'Escrow not found for this transaction'
        });
        return;
      }

      // Don't expose the hashed delivery code
      const escrowData = escrow.toObject();
      delete escrowData.deliveryCode;

      res.status(200).json({
        success: true,
        data: escrowData
      });
    } catch (error: any) {
      console.error('Error fetching escrow:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Confirm delivery with code
   * POST /api/escrow/:escrowId/confirm-delivery
   */
  async confirmDelivery(req: Request, res: Response): Promise<void> {
    try {
      const escrowId = req.params.escrowId as string;
      const { deliveryCode, confirmedBy } = req.body;

      if (!deliveryCode || !confirmedBy) {
        res.status(400).json({
          success: false,
          error: 'Missing delivery code or confirmedBy field'
        });
        return;
      }

      const escrow = await escrowService.confirmDelivery(escrowId, deliveryCode, confirmedBy);

      res.status(200).json({
        success: true,
        message: 'Delivery confirmed successfully',
        data: {
          escrowId: escrow.escrowId,
          status: escrow.status,
          confirmedAt: escrow.confirmedAt
        }
      });
    } catch (error: any) {
      console.error('Error confirming delivery:', error.message);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Release funds to seller (internal/admin use)
   * POST /api/escrow/:escrowId/release
   */
  async releaseFunds(req: Request, res: Response): Promise<void> {
    try {
      const escrowId = req.params.escrowId as string;

      const escrow = await escrowService.releaseFunds(escrowId);

      res.status(200).json({
        success: true,
        message: 'Funds released successfully',
        data: {
          escrowId: escrow.escrowId,
          status: escrow.status,
          releasedAt: escrow.releasedAt
        }
      });
    } catch (error: any) {
      console.error('Error releasing funds:', error.message);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Refund escrow (internal/admin use)
   * POST /api/escrow/:escrowId/refund
   */
  async refundEscrow(req: Request, res: Response): Promise<void> {
    try {
      const escrowId = req.params.escrowId as string;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Refund reason is required'
        });
        return;
      }

      const escrow = await escrowService.refundEscrow(escrowId, reason);

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          escrowId: escrow.escrowId,
          status: escrow.status,
          refundedAt: escrow.refundedAt
        }
      });
    } catch (error: any) {
      console.error('Error processing refund:', error.message);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check if seller can withdraw funds
   * GET /api/escrow/seller/:sellerId/can-withdraw
   */
  async canWithdraw(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.params.sellerId as string;
      const { amount } = req.query;

      const canWithdraw = await escrowService.canWithdraw(
        sellerId,
        amount ? parseFloat(amount as string) : 0
      );

      res.status(200).json({
        success: true,
        data: {
          canWithdraw,
          message: canWithdraw 
            ? 'Withdrawal allowed' 
            : 'Cannot withdraw - funds are locked in escrow'
        }
      });
    } catch (error: any) {
      console.error('Error checking withdrawal eligibility:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get seller's available balance
   * GET /api/escrow/seller/:sellerId/balance
   */
  async getAvailableBalance(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.params.sellerId as string;

      const balance = await escrowService.getAvailableBalance(sellerId);

      res.status(200).json({
        success: true,
        data: {
          sellerId,
          availableBalance: balance
        }
      });
    } catch (error: any) {
      console.error('Error fetching available balance:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new EscrowController();
