// Demo script to showcase AuctionMe functionality
// Run with: node demo.js (requires server to be running and MongoDB connected)

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Auction = require('./src/models/Auction');
const Bid = require('./src/models/Bid');
const auctionService = require('./src/services/auctionService');
const bidService = require('./src/services/bidService');
const auctionScheduler = require('./src/schedulers/auctionScheduler');

async function runDemo() {
  try {
    console.log('🎬 AuctionMe Demo Starting...\n');
    
    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auctionme';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up existing demo data
    await User.deleteMany({ username: /^demo/ });
    await Auction.deleteMany({ title: /^Demo/ });
    console.log('🧹 Cleaned up previous demo data\n');

    // Step 1: Create demo users
    console.log('👥 Step 1: Creating demo users...');
    const seller = await User.create({
      username: 'demo-seller',
      email: 'seller@demo.com',
      role: 'seller'
    });
    console.log(`   ✓ Seller created: ${seller.username} (${seller._id})`);

    const bidder1 = await User.create({
      username: 'demo-bidder1',
      email: 'bidder1@demo.com',
      role: 'buyer'
    });
    console.log(`   ✓ Bidder 1 created: ${bidder1.username} (${bidder1._id})`);

    const bidder2 = await User.create({
      username: 'demo-bidder2',
      email: 'bidder2@demo.com',
      role: 'buyer'
    });
    console.log(`   ✓ Bidder 2 created: ${bidder2.username} (${bidder2._id})\n`);

    // Step 2: Create auction
    console.log('🎯 Step 2: Creating auction...');
    const auction = await auctionService.createAuction({
      title: 'Demo MacBook Pro 2020',
      description: 'Used MacBook Pro 16-inch, 16GB RAM, 512GB SSD',
      images: ['image1.jpg', 'image2.jpg'],
      startingBid: 800,
      duration: 0.05, // 3 minutes for demo
      sellerId: seller._id
    });
    console.log(`   ✓ Auction created: "${auction.title}"`);
    console.log(`   - Starting bid: $${auction.startingBid}`);
    console.log(`   - Duration: ${auction.duration * 60} minutes`);
    console.log(`   - End time: ${auction.endTime}`);
    console.log(`   - Status: ${auction.status}`);
    console.log(`   - Can edit: ${auction.canEdit()}\n`);

    // Step 3: Try to update auction (should work - no bids yet)
    console.log('✏️  Step 3: Updating auction before bids...');
    const updatedAuction = await auctionService.updateAuction(
      auction._id,
      { description: 'Updated: MacBook Pro 16-inch, 16GB RAM, 512GB SSD, AppleCare+' },
      seller._id.toString()
    );
    console.log(`   ✓ Auction updated: "${updatedAuction.description}"\n`);

    // Step 4: Browse auctions
    console.log('🔍 Step 4: Browsing auctions...');
    const browseResult = await auctionService.browseAuctions({}, 1, 10);
    console.log(`   ✓ Found ${browseResult.auctions.length} active auction(s)`);
    console.log(`   - Total pages: ${browseResult.pagination.pages}\n`);

    // Step 5: Place first bid
    console.log('💰 Step 5: Placing first bid...');
    const bid1 = await bidService.placeBid(auction._id, bidder1._id, 850);
    console.log(`   ✓ Bid placed: $${bid1.amount} by ${bidder1.username}`);
    
    const auctionAfterBid1 = await Auction.findById(auction._id);
    console.log(`   - Current bid: $${auctionAfterBid1.currentBid}`);
    console.log(`   - Bid count: ${auctionAfterBid1.bidCount}`);
    console.log(`   - First bid time: ${auctionAfterBid1.firstBidTime}`);
    console.log(`   - Can edit: ${auctionAfterBid1.canEdit()}\n`);

    // Step 6: Try to update auction after bid (should fail)
    console.log('🚫 Step 6: Attempting to update auction after first bid...');
    try {
      await auctionService.updateAuction(
        auction._id,
        { title: 'Should not work' },
        seller._id.toString()
      );
      console.log('   ✗ ERROR: Update should have failed!\n');
    } catch (error) {
      console.log(`   ✓ Update blocked: ${error.message}\n`);
    }

    // Step 7: Place more bids
    console.log('💰 Step 7: Placing competing bids...');
    const bid2 = await bidService.placeBid(auction._id, bidder2._id, 900);
    console.log(`   ✓ Bid placed: $${bid2.amount} by ${bidder2.username}`);
    
    const bid3 = await bidService.placeBid(auction._id, bidder1._id, 950);
    console.log(`   ✓ Bid placed: $${bid3.amount} by ${bidder1.username}`);
    
    const bid4 = await bidService.placeBid(auction._id, bidder2._id, 1000);
    console.log(`   ✓ Bid placed: $${bid4.amount} by ${bidder2.username}\n`);

    // Step 8: Try invalid bid (too low)
    console.log('🚫 Step 8: Attempting invalid bid (too low)...');
    try {
      await bidService.placeBid(auction._id, bidder1._id, 900);
      console.log('   ✗ ERROR: Bid should have been rejected!\n');
    } catch (error) {
      console.log(`   ✓ Bid rejected: ${error.message}\n`);
    }

    // Step 9: Try seller bidding on own auction
    console.log('🚫 Step 9: Attempting seller bid on own auction...');
    try {
      await bidService.placeBid(auction._id, seller._id, 1100);
      console.log('   ✗ ERROR: Seller bid should have been rejected!\n');
    } catch (error) {
      console.log(`   ✓ Bid rejected: ${error.message}\n`);
    }

    // Step 10: Get auction bids
    console.log('📊 Step 10: Retrieving bid history...');
    const bidsResult = await bidService.getAuctionBids(auction._id);
    console.log(`   ✓ Total bids: ${bidsResult.pagination.total}`);
    bidsResult.bids.forEach((bid, index) => {
      console.log(`   ${index + 1}. $${bid.amount} by ${bid.bidderId.username}`);
    });
    console.log('');

    // Step 11: Get highest bid
    console.log('🏆 Step 11: Getting highest bid...');
    const highestBid = await bidService.getHighestBid(auction._id);
    console.log(`   ✓ Highest bid: $${highestBid.amount} by ${highestBid.bidderId.username}\n`);

    // Step 12: Close auction and determine winner
    console.log('🔚 Step 12: Manually closing auction...');
    const closedAuction = await auctionService.closeAuction(auction._id);
    console.log(`   ✓ Auction closed`);
    console.log(`   - Status: ${closedAuction.status}`);
    console.log(`   - Final bid: $${closedAuction.currentBid}`);
    console.log(`   - Winner: ${closedAuction.winnerId}\n`);

    // Step 13: Verify winner
    const winner = await User.findById(closedAuction.winnerId);
    console.log(`🎉 Step 13: Winner announcement!`);
    console.log(`   🏆 Winner: ${winner.username} (${winner.email})`);
    console.log(`   💵 Winning bid: $${closedAuction.currentBid}\n`);

    // Step 14: Test automatic scheduler
    console.log('⏰ Step 14: Testing automatic scheduler...');
    console.log('   Creating short-duration auction...');
    const quickAuction = await auctionService.createAuction({
      title: 'Demo Quick Auction',
      description: 'Will expire in 1 minute',
      startingBid: 50,
      duration: 0.0167, // 1 minute
      sellerId: seller._id
    });
    await bidService.placeBid(quickAuction._id, bidder1._id, 60);
    console.log(`   ✓ Quick auction created (expires at ${quickAuction.endTime})`);
    console.log('   ℹ️  Scheduler runs every minute and will auto-close this auction\n');

    console.log('✨ Demo completed successfully!\n');
    console.log('📝 Summary:');
    console.log('   - Created 3 users (1 seller, 2 bidders)');
    console.log('   - Created 2 auctions');
    console.log('   - Placed 4 successful bids');
    console.log('   - Tested edit prevention after first bid');
    console.log('   - Tested bid validation (amount, seller restriction)');
    console.log('   - Closed auction and determined winner');
    console.log('   - Created test auction for automatic scheduler\n');
    
    console.log('🔗 Next steps:');
    console.log('   - View auctions: GET http://localhost:3000/api/auctions');
    console.log('   - View specific auction: GET http://localhost:3000/api/auctions/' + auction._id);
    console.log('   - View bids: GET http://localhost:3000/api/auctions/' + auction._id + '/bids');
    console.log('   - Wait ~1 minute to see scheduler auto-close the quick auction\n');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the demo
if (require.main === module) {
  runDemo();
}

module.exports = runDemo;
