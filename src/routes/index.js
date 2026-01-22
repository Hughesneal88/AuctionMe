const express = require('express');
const router = express.Router();

const auctionRoutes = require('./auctionRoutes');
const bidRoutes = require('./bidRoutes');

router.use('/auctions', auctionRoutes);
router.use('/api', bidRoutes);

module.exports = router;
