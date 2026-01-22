const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');

// Bid routes
router.post('/auctions/:id/bids', bidController.placeBid.bind(bidController));
router.get('/auctions/:id/bids', bidController.getAuctionBids.bind(bidController));
router.get('/auctions/:id/bids/highest', bidController.getHighestBid.bind(bidController));
router.get('/users/:userId/bids', bidController.getUserBids.bind(bidController));

module.exports = router;
