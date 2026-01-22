import { Router } from 'express';
import { bidController } from '../controllers/bidController';

const router = Router();

// Place a new bid
router.post('/', (req, res) => bidController.placeBid(req, res));

// Get all bids for an auction
router.get('/auction/:auctionId', (req, res) => bidController.getBidsForAuction(req, res));

// Get highest bid for an auction
router.get('/auction/:auctionId/highest', (req, res) => bidController.getHighestBid(req, res));

// Get all bids by a bidder
router.get('/bidder/:bidderId', (req, res) => bidController.getBidsByBidder(req, res));

export default router;
