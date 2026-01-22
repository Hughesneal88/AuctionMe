const cron = require('node-cron');
const auctionService = require('../services/auctionService');

class AuctionScheduler {
  constructor() {
    this.job = null;
  }

  // Start the scheduler to check for expired auctions every minute
  start() {
    console.log('Starting auction scheduler...');
    
    // Run every minute: "* * * * *"
    this.job = cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndCloseExpiredAuctions();
      } catch (error) {
        console.error('Error in auction scheduler:', error.message);
      }
    });
    
    console.log('Auction scheduler started successfully');
  }

  // Stop the scheduler
  stop() {
    if (this.job) {
      this.job.stop();
      console.log('Auction scheduler stopped');
    }
  }

  // Check for expired auctions and close them
  async checkAndCloseExpiredAuctions() {
    try {
      const expiredAuctions = await auctionService.getExpiredAuctions();
      
      if (expiredAuctions.length === 0) {
        return;
      }
      
      console.log(`Found ${expiredAuctions.length} expired auction(s)`);
      
      for (const auction of expiredAuctions) {
        try {
          const closedAuction = await auctionService.closeAuction(auction._id);
          console.log(`Closed auction ${closedAuction._id} - Winner: ${closedAuction.winnerId || 'No bids'}`);
        } catch (error) {
          console.error(`Error closing auction ${auction._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error checking expired auctions:', error.message);
    }
  }

  // Manually trigger check (useful for testing)
  async triggerCheck() {
    await this.checkAndCloseExpiredAuctions();
  }
}

module.exports = new AuctionScheduler();
