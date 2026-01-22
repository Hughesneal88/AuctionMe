const BiddingService = require('../../src/services/BiddingService');

describe('BiddingService', () => {
  let biddingService;

  beforeEach(() => {
    biddingService = new BiddingService();
  });

  describe('createAuction', () => {
    it('should create a new auction', () => {
      const sellerId = 'seller-123';
      const title = 'Vintage Camera';
      const description = 'A classic 35mm camera';
      const startingBid = 50;
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const auction = biddingService.createAuction(sellerId, title, description, startingBid, endTime);

      expect(auction).toBeDefined();
      expect(auction.sellerId).toBe(sellerId);
      expect(auction.title).toBe(title);
      expect(auction.description).toBe(description);
      expect(auction.startingBid).toBe(startingBid);
      expect(auction.currentBid).toBe(startingBid);
      expect(auction.endTime).toBe(endTime);
      expect(auction.status).toBe('active');
    });
  });

  describe('placeBid', () => {
    let auction;

    beforeEach(() => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);
    });

    it('should place a valid bid', () => {
      const bidderId = 'bidder-456';
      const amount = 60;

      const bid = biddingService.placeBid(auction.id, bidderId, amount);

      expect(bid).toBeDefined();
      expect(bid.auctionId).toBe(auction.id);
      expect(bid.bidderId).toBe(bidderId);
      expect(bid.amount).toBe(amount);
      expect(bid.status).toBe('winning');

      const updatedAuction = biddingService.getAuction(auction.id);
      expect(updatedAuction.currentBid).toBe(amount);
    });

    it('should mark previous bid as outbid', () => {
      const bidder1 = 'bidder-1';
      const bidder2 = 'bidder-2';

      biddingService.placeBid(auction.id, bidder1, 60);
      const bid2 = biddingService.placeBid(auction.id, bidder2, 70);

      // Get the first bid from storage to check its status
      const bids = biddingService.getBidsForAuction(auction.id);
      const bid1 = bids.find(b => b.bidderId === bidder1);

      expect(bid1.status).toBe('outbid');
      expect(bid2.status).toBe('winning');
    });

    it('should reject bid lower than current bid', () => {
      biddingService.placeBid(auction.id, 'bidder-1', 60);

      expect(() => {
        biddingService.placeBid(auction.id, 'bidder-2', 55);
      }).toThrow('Bid must be higher than current bid');
    });

    it('should reject bid equal to current bid', () => {
      biddingService.placeBid(auction.id, 'bidder-1', 60);

      expect(() => {
        biddingService.placeBid(auction.id, 'bidder-2', 60);
      }).toThrow('Bid must be higher than current bid');
    });

    it('should reject seller bidding on own auction', () => {
      expect(() => {
        biddingService.placeBid(auction.id, auction.sellerId, 60);
      }).toThrow('Seller cannot bid on their own auction');
    });

    it('should reject bid on non-existent auction', () => {
      expect(() => {
        biddingService.placeBid('non-existent-id', 'bidder-1', 60);
      }).toThrow('Auction not found');
    });

    it('should reject bid on ended auction', () => {
      biddingService.endAuction(auction.id);

      expect(() => {
        biddingService.placeBid(auction.id, 'bidder-1', 60);
      }).toThrow('Auction is not active');
    });

    it('should reject invalid bid amount', () => {
      expect(() => {
        biddingService.placeBid(auction.id, 'bidder-1', -10);
      }).toThrow('Bid amount must be a positive number');
    });
  });

  describe('getWinningBid', () => {
    it('should return winning bid', () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);

      biddingService.placeBid(auction.id, 'bidder-1', 60);
      const bid2 = biddingService.placeBid(auction.id, 'bidder-2', 70);

      const winningBid = biddingService.getWinningBid(auction.id);

      expect(winningBid.id).toBe(bid2.id);
      expect(winningBid.amount).toBe(70);
    });

    it('should return null if no bids', () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);

      const winningBid = biddingService.getWinningBid(auction.id);

      expect(winningBid).toBeNull();
    });
  });

  describe('endAuction', () => {
    it('should end an auction', () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);

      biddingService.placeBid(auction.id, 'bidder-1', 60);
      biddingService.placeBid(auction.id, 'bidder-2', 70);
      biddingService.placeBid(auction.id, 'bidder-3', 80); // Higher than previous bid

      const endedAuction = biddingService.endAuction(auction.id);

      expect(endedAuction.status).toBe('ended');

      const bids = biddingService.getBidsForAuction(auction.id);
      const winningBid = bids.find(b => b.status === 'winning');
      const lostBids = bids.filter(b => b.status === 'lost' || b.status === 'outbid');

      expect(winningBid).toBeDefined();
      expect(lostBids.length).toBeGreaterThan(0);
    });
  });

  describe('completeAuction', () => {
    it('should complete an ended auction', () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);

      biddingService.endAuction(auction.id);
      const completedAuction = biddingService.completeAuction(auction.id);

      expect(completedAuction.status).toBe('completed');
    });

    it('should not complete non-ended auction', () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);

      expect(() => {
        biddingService.completeAuction(auction.id);
      }).toThrow('Auction must be ended before completing');
    });
  });

  describe('cancelAuction', () => {
    it('should cancel an active auction', () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);

      const cancelledAuction = biddingService.cancelAuction(auction.id, auction.sellerId);

      expect(cancelledAuction.status).toBe('cancelled');
    });

    it('should not allow non-seller to cancel', () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);

      expect(() => {
        biddingService.cancelAuction(auction.id, 'other-user');
      }).toThrow('Only the seller can cancel the auction');
    });

    it('should not cancel ended auction', () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Description', 50, endTime);

      biddingService.endAuction(auction.id);

      expect(() => {
        biddingService.cancelAuction(auction.id, auction.sellerId);
      }).toThrow('Can only cancel active auctions');
    });
  });

  describe('getActiveAuctions', () => {
    it('should return only active auctions', () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction1 = biddingService.createAuction('seller-1', 'Item 1', 'Desc 1', 50, futureTime);
      const auction2 = biddingService.createAuction('seller-2', 'Item 2', 'Desc 2', 60, futureTime);
      const auction3 = biddingService.createAuction('seller-3', 'Item 3', 'Desc 3', 70, futureTime);

      biddingService.endAuction(auction2.id);

      const activeAuctions = biddingService.getActiveAuctions();

      expect(activeAuctions).toHaveLength(2);
      expect(activeAuctions.find(a => a.id === auction1.id)).toBeDefined();
      expect(activeAuctions.find(a => a.id === auction3.id)).toBeDefined();
      expect(activeAuctions.find(a => a.id === auction2.id)).toBeUndefined();
    });
  });

  describe('getAuctionsBySeller', () => {
    it('should return auctions for a specific seller', () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction1 = biddingService.createAuction('seller-1', 'Item 1', 'Desc 1', 50, futureTime);
      const auction2 = biddingService.createAuction('seller-1', 'Item 2', 'Desc 2', 60, futureTime);
      const auction3 = biddingService.createAuction('seller-2', 'Item 3', 'Desc 3', 70, futureTime);

      const sellerAuctions = biddingService.getAuctionsBySeller('seller-1');

      expect(sellerAuctions).toHaveLength(2);
      expect(sellerAuctions.find(a => a.id === auction1.id)).toBeDefined();
      expect(sellerAuctions.find(a => a.id === auction2.id)).toBeDefined();
      expect(sellerAuctions.find(a => a.id === auction3.id)).toBeUndefined();
    });
  });
});
