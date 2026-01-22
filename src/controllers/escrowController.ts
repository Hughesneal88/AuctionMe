import { Request, Response } from 'express';
import { EscrowService } from '../services/EscrowService';

const escrowService = new EscrowService();

/**
 * Get escrow details by ID
 */
export const getEscrow = async (req: Request, res: Response) => {
  try {
    const escrow_id = req.params.escrow_id as string;

    if (!escrow_id) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required',
      });
    }

    const escrow = await escrowService.getEscrow(parseInt(escrow_id));

    res.status(200).json({
      success: true,
      data: escrow,
    });
  } catch (error: any) {
    console.error('Get escrow error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Escrow not found',
    });
  }
};

/**
 * Get escrow details by auction ID
 */
export const getEscrowByAuction = async (req: Request, res: Response) => {
  try {
    const auction_id = req.params.auction_id as string;

    if (!auction_id) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required',
      });
    }

    const escrow = await escrowService.getEscrowByAuction(parseInt(auction_id));

    res.status(200).json({
      success: true,
      data: escrow,
    });
  } catch (error: any) {
    console.error('Get escrow by auction error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Escrow not found',
    });
  }
};

/**
 * Verify delivery code (without releasing funds)
 */
export const verifyDelivery = async (req: Request, res: Response) => {
  try {
    const escrow_id = req.params.escrow_id as string;
    const { delivery_code } = req.body;

    if (!escrow_id || !delivery_code) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID and delivery code are required',
      });
    }

    const escrow = await escrowService.verifyDelivery(parseInt(escrow_id), delivery_code);

    res.status(200).json({
      success: true,
      message: 'Delivery verified successfully',
      data: escrow,
    });
  } catch (error: any) {
    console.error('Verify delivery error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify delivery',
    });
  }
};

/**
 * Release escrow funds to seller
 */
export const releaseEscrow = async (req: Request, res: Response) => {
  try {
    const escrow_id = req.params.escrow_id as string;
    const { delivery_code } = req.body;

    if (!escrow_id || !delivery_code) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID and delivery code are required',
      });
    }

    const escrow = await escrowService.releaseEscrow(parseInt(escrow_id), delivery_code);

    res.status(200).json({
      success: true,
      message: 'Escrow released successfully',
      data: escrow,
    });
  } catch (error: any) {
    console.error('Release escrow error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to release escrow',
    });
  }
};

/**
 * Refund escrow to buyer
 */
export const refundEscrow = async (req: Request, res: Response) => {
  try {
    const escrow_id = req.params.escrow_id as string;
    const { reason } = req.body;

    if (!escrow_id) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required',
      });
    }

    const escrow = await escrowService.refundEscrow(parseInt(escrow_id), reason);

    res.status(200).json({
      success: true,
      message: 'Escrow refunded successfully',
      data: escrow,
    });
  } catch (error: any) {
    console.error('Refund escrow error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to refund escrow',
    });
  }
};

/**
 * Dispute escrow
 */
export const disputeEscrow = async (req: Request, res: Response) => {
  try {
    const escrow_id = req.params.escrow_id as string;
    const { reason } = req.body;

    if (!escrow_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID and reason are required',
      });
    }

    const escrow = await escrowService.disputeEscrow(parseInt(escrow_id), reason);

    res.status(200).json({
      success: true,
      message: 'Escrow disputed successfully',
      data: escrow,
    });
  } catch (error: any) {
    console.error('Dispute escrow error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to dispute escrow',
    });
  }
};

/**
 * Check if seller can withdraw (admin endpoint)
 */
export const checkWithdrawalEligibility = async (req: Request, res: Response) => {
  try {
    const { seller_id, amount } = req.body;

    if (!seller_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID and amount are required',
      });
    }

    const canWithdraw = await escrowService.canWithdraw(parseInt(seller_id), parseFloat(amount));

    res.status(200).json({
      success: true,
      data: {
        can_withdraw: canWithdraw,
        message: canWithdraw 
          ? 'Withdrawal allowed' 
          : 'Withdrawal blocked: Funds locked in escrow',
      },
    });
  } catch (error: any) {
    console.error('Check withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check withdrawal eligibility',
    });
  }
};

/**
 * Get all held escrows (admin endpoint)
 */
export const getAllHeldEscrows = async (req: Request, res: Response) => {
  try {
    const escrows = await escrowService.getAllHeldEscrows();

    res.status(200).json({
      success: true,
      data: escrows,
    });
  } catch (error: any) {
    console.error('Get held escrows error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get held escrows',
    });
  }
};
