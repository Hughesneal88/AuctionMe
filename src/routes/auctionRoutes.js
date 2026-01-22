const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');

// Auction routes
router.post('/', auctionController.createAuction.bind(auctionController));
router.get('/', auctionController.browseAuctions.bind(auctionController));
router.get('/:id', auctionController.getAuction.bind(auctionController));
router.put('/:id', auctionController.updateAuction.bind(auctionController));
router.post('/:id/close', auctionController.closeAuction.bind(auctionController));

module.exports = router;
