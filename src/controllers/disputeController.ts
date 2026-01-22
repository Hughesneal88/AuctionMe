import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import disputeService from '../services/disputeService';
import { DisputeReason } from '../types/enums';
import mongoose from 'mongoose';

class DisputeController {
  /**
   * Create a new dispute
   * POST /api/disputes
   */
  async createDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { auctionId, reason, description, evidence } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Validate required fields
      if (!auctionId || !reason || !description) {
        res.status(400).json({ 
          error: 'Missing required fields: auctionId, reason, description' 
        });
        return;
      }

      // Validate reason
      if (!Object.values(DisputeReason).includes(reason)) {
        res.status(400).json({ 
          error: 'Invalid dispute reason',
          validReasons: Object.values(DisputeReason)
        });
        return;
      }

      const dispute = await disputeService.createDispute({
        auctionId: new mongoose.Types.ObjectId(auctionId),
        buyerId: req.user._id,
        reason,
        description,
        evidence: evidence || []
      });

      res.status(201).json({
        message: 'Dispute created successfully',
        dispute
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all disputes (for buyer or seller)
   * GET /api/disputes
   */
  async getDisputes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { status, page, limit } = req.query;

      const filters: any = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      };

      if (status) {
        filters.status = status;
      }

      // Regular users can only see their own disputes
      filters.buyerId = req.user._id;

      const result = await disputeService.getDisputes(filters);

      res.json({
        disputes: result.disputes,
        pagination: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(result.total / filters.limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get a single dispute
   * GET /api/disputes/:id
   */
  async getDisputeById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const dispute = await disputeService.getDisputeById(
        new mongoose.Types.ObjectId(id as string)
      );

      if (!dispute) {
        res.status(404).json({ error: 'Dispute not found' });
        return;
      }

      // Check if user is authorized to view this dispute
      if (
        dispute.buyerId._id.toString() !== req.user._id.toString() &&
        dispute.sellerId._id.toString() !== req.user._id.toString()
      ) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({ dispute });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add evidence to a dispute
   * POST /api/disputes/:id/evidence
   */
  async addEvidence(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { description, imageUrls } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!description) {
        res.status(400).json({ error: 'Evidence description is required' });
        return;
      }

      const evidence = {
        description,
        imageUrls: imageUrls || [],
        uploadedAt: new Date()
      };

      const dispute = await disputeService.addEvidence(
        new mongoose.Types.ObjectId(id as string),
        req.user._id,
        evidence
      );

      res.json({
        message: 'Evidence added successfully',
        dispute
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new DisputeController();
