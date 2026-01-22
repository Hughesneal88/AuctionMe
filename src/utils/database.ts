import { User } from '../models/User';
import { Auction } from '../models/Auction';
import { Bid } from '../models/Bid';
import { Notification } from '../models/Notification';

// Simple in-memory database for demonstration
class Database {
  private users: Map<string, User> = new Map();
  private auctions: Map<string, Auction> = new Map();
  private bids: Map<string, Bid> = new Map();
  private notifications: Map<string, Notification> = new Map();

  // User methods
  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Auction methods
  createAuction(auction: Auction): Auction {
    this.auctions.set(auction.id, auction);
    return auction;
  }

  getAuctionById(id: string): Auction | undefined {
    return this.auctions.get(id);
  }

  getAllAuctions(): Auction[] {
    return Array.from(this.auctions.values());
  }

  updateAuction(id: string, updates: Partial<Auction>): Auction | undefined {
    const auction = this.auctions.get(id);
    if (!auction) return undefined;
    
    const updated = { ...auction, ...updates, updatedAt: new Date() };
    this.auctions.set(id, updated);
    return updated;
  }

  // Bid methods
  createBid(bid: Bid): Bid {
    this.bids.set(bid.id, bid);
    return bid;
  }

  getBidById(id: string): Bid | undefined {
    return this.bids.get(id);
  }

  getBidsByAuctionId(auctionId: string): Bid[] {
    return Array.from(this.bids.values())
      .filter(bid => bid.auctionId === auctionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getBidsByBidderId(bidderId: string): Bid[] {
    return Array.from(this.bids.values())
      .filter(bid => bid.bidderId === bidderId);
  }

  getHighestBidForAuction(auctionId: string): Bid | undefined {
    const bids = Array.from(this.bids.values())
      .filter(bid => bid.auctionId === auctionId);
    
    if (bids.length === 0) return undefined;
    
    // Return the bid with the highest amount
    return bids.reduce((highest, current) => 
      current.amount > highest.amount ? current : highest
    );
  }

  // Notification methods
  createNotification(notification: Notification): Notification {
    this.notifications.set(notification.id, notification);
    return notification;
  }

  getNotificationsByUserId(userId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Clear all data (for testing)
  clear(): void {
    this.users.clear();
    this.auctions.clear();
    this.bids.clear();
    this.notifications.clear();
  }
}

export const db = new Database();
