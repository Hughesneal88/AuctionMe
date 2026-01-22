const BiddingService = require('../../src/services/BiddingService');
const EscrowService = require('../../src/services/EscrowService');
const PaymentService = require('../../src/services/PaymentService');
const MockPaymentGateway = require('../../src/services/MockPaymentGateway');

describe('Bidding Flow Integration', () => {
  let biddingService;
  let escrowService;
  let paymentService;
  let mockGateway;

  beforeEach(() => {
    mockGateway = new MockPaymentGateway();
    paymentService = new PaymentService(mockGateway);
    escrowService = new EscrowService(paymentService);
    biddingService = new BiddingService();
  });

  describe('Complete auction flow with bidding', () => {
    it('should handle complete auction lifecycle from creation to delivery', async () => {
      // 1. Seller creates an auction
      const sellerId = 'seller-123';
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction(
        sellerId,
        'Vintage Camera',
        'A classic 35mm camera in excellent condition',
        50,
        endTime
      );

      expect(auction.status).toBe('active');
      expect(auction.currentBid).toBe(50);

      // 2. Multiple bidders place bids
      const bidder1 = 'bidder-001';
      const bidder2 = 'bidder-002';
      const bidder3 = 'bidder-003';

      const bid1 = biddingService.placeBid(auction.id, bidder1, 60);
      expect(bid1.status).toBe('winning');

      const bid2 = biddingService.placeBid(auction.id, bidder2, 75);
      expect(bid2.status).toBe('winning');
      expect(bid1.status).toBe('outbid');

      const bid3 = biddingService.placeBid(auction.id, bidder3, 90);
      expect(bid3.status).toBe('winning');
      expect(bid2.status).toBe('outbid');

      // 3. Auction ends
      const endedAuction = biddingService.endAuction(auction.id);
      expect(endedAuction.status).toBe('ended');
      expect(endedAuction.currentBid).toBe(90);

      // 4. Get winning bid
      const winningBid = biddingService.getWinningBid(auction.id);
      expect(winningBid.bidderId).toBe(bidder3);
      expect(winningBid.amount).toBe(90);

      // 5. Create escrow and charge winner
      const escrow = await escrowService.createEscrow(
        auction.id,
        winningBid.bidderId,
        sellerId,
        winningBid.amount
      );

      expect(escrow.status).toBe('held');
      expect(escrow.amount).toBe(90);
      expect(escrow.deliveryCode).toBeDefined();

      // 6. Seller delivers item and provides code to buyer
      const deliveryCode = escrow.deliveryCode;

      // 7. Buyer receives item and confirms with code
      escrowService.verifyDelivery(escrow.id, deliveryCode);
      expect(escrow.deliveryConfirmedAt).toBeDefined();

      // 8. Simulate time passing (24+ hours)
      escrow.deliveryConfirmedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      // 9. Release funds to seller
      const releasedEscrow = await escrowService.releaseFunds(escrow.id);
      expect(releasedEscrow.status).toBe('released');
      expect(releasedEscrow.releasedAt).toBeDefined();

      // 10. Complete auction
      const completedAuction = biddingService.completeAuction(auction.id);
      expect(completedAuction.status).toBe('completed');
    });

    it('should handle auction with no bids', () => {
      const sellerId = 'seller-123';
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction(
        sellerId,
        'Vintage Camera',
        'A classic 35mm camera',
        50,
        endTime
      );

      const endedAuction = biddingService.endAuction(auction.id);
      expect(endedAuction.status).toBe('ended');
      expect(endedAuction.currentBid).toBe(50);

      const winningBid = biddingService.getWinningBid(auction.id);
      expect(winningBid).toBeNull();
    });

    it('should handle auction cancellation', async () => {
      // 1. Create auction
      const sellerId = 'seller-123';
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction(
        sellerId,
        'Vintage Camera',
        'A classic 35mm camera',
        50,
        endTime
      );

      // 2. Place some bids
      biddingService.placeBid(auction.id, 'bidder-1', 60);
      biddingService.placeBid(auction.id, 'bidder-2', 75);

      // 3. Seller cancels auction
      const cancelledAuction = biddingService.cancelAuction(auction.id, sellerId);
      expect(cancelledAuction.status).toBe('cancelled');

      // 4. Cannot place bids on cancelled auction
      expect(() => {
        biddingService.placeBid(auction.id, 'bidder-3', 90);
      }).toThrow('Auction is not active');
    });
  });

  describe('Multiple auctions and bidders', () => {
    it('should handle multiple concurrent auctions', async () => {
      const seller1 = 'seller-1';
      const seller2 = 'seller-2';
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create multiple auctions
      const auction1 = biddingService.createAuction(seller1, 'Item 1', 'Description 1', 50, endTime);
      const auction2 = biddingService.createAuction(seller2, 'Item 2', 'Description 2', 100, endTime);
      const auction3 = biddingService.createAuction(seller1, 'Item 3', 'Description 3', 75, endTime);

      // Place bids on different auctions
      biddingService.placeBid(auction1.id, 'bidder-1', 60);
      biddingService.placeBid(auction2.id, 'bidder-2', 120);
      biddingService.placeBid(auction3.id, 'bidder-1', 90);
      biddingService.placeBid(auction1.id, 'bidder-3', 70);

      // Check active auctions
      const activeAuctions = biddingService.getActiveAuctions();
      expect(activeAuctions).toHaveLength(3);

      // Check seller's auctions
      const seller1Auctions = biddingService.getAuctionsBySeller(seller1);
      expect(seller1Auctions).toHaveLength(2);

      // End one auction
      biddingService.endAuction(auction1.id);

      // Check active auctions again
      const activeAfterEnd = biddingService.getActiveAuctions();
      expect(activeAfterEnd).toHaveLength(2);
    });

    it('should handle same bidder on multiple auctions', () => {
      const bidderId = 'bidder-123';
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const auction1 = biddingService.createAuction('seller-1', 'Item 1', 'Desc 1', 50, endTime);
      const auction2 = biddingService.createAuction('seller-2', 'Item 2', 'Desc 2', 100, endTime);

      // Same bidder wins multiple auctions
      biddingService.placeBid(auction1.id, bidderId, 60);
      biddingService.placeBid(auction2.id, bidderId, 120);

      const winning1 = biddingService.getWinningBid(auction1.id);
      const winning2 = biddingService.getWinningBid(auction2.id);

      expect(winning1.bidderId).toBe(bidderId);
      expect(winning2.bidderId).toBe(bidderId);
    });
  });

  describe('Error scenarios', () => {
    it('should handle payment failure during escrow creation', async () => {
      mockGateway.setFailureRate(1); // Force failure

      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Desc', 50, endTime);
      const bid = biddingService.placeBid(auction.id, 'bidder-456', 60);

      biddingService.endAuction(auction.id);

      await expect(
        escrowService.createEscrow(auction.id, bid.bidderId, auction.sellerId, bid.amount)
      ).rejects.toThrow('Failed to create escrow');
    });

    it('should handle incorrect delivery code', async () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Desc', 50, endTime);
      const bid = biddingService.placeBid(auction.id, 'bidder-456', 60);

      biddingService.endAuction(auction.id);

      const escrow = await escrowService.createEscrow(
        auction.id,
        bid.bidderId,
        auction.sellerId,
        bid.amount
      );

      expect(() => {
        escrowService.verifyDelivery(escrow.id, '000000');
      }).toThrow('Invalid delivery code');
    });

    it('should prevent premature fund release', async () => {
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const auction = biddingService.createAuction('seller-123', 'Item', 'Desc', 50, endTime);
      const bid = biddingService.placeBid(auction.id, 'bidder-456', 60);

      biddingService.endAuction(auction.id);

      const escrow = await escrowService.createEscrow(
        auction.id,
        bid.bidderId,
        auction.sellerId,
        bid.amount
      );

      escrowService.verifyDelivery(escrow.id, escrow.deliveryCode);

      // Try to release immediately (should fail)
      await expect(
        escrowService.releaseFunds(escrow.id)
      ).rejects.toThrow('Funds can only be released');
    });
  });
});
