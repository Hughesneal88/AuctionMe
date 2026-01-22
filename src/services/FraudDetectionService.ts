import { BidValidation } from '../types';
import { auditService } from './AuditService';

/**
 * Service for detecting and preventing fake bids and spam
 */
export class FraudDetectionService {
  private readonly MIN_BID_INCREMENT = 1; // Minimum bid increment in dollars
  private readonly MAX_BID_AMOUNT = 10000; // Maximum bid amount
  private readonly SUSPICIOUS_BID_VELOCITY = 5; // Max bids per minute per user

  // Track bid history per user
  private userBidHistory: Map<string, Array<{ timestamp: Date; amount: number; auctionId: string }>> = new Map();

  /**
   * Validate a bid for potential fraud
   */
  async validateBid(
    userId: string,
    auctionId: string,
    bidAmount: number,
    currentHighestBid: number = 0
  ): Promise<BidValidation> {
    const flags: string[] = [];
    let riskScore = 0;

    // Check bid amount
    if (bidAmount <= 0) {
      return {
        isValid: false,
        reason: 'Bid amount must be positive',
        riskScore: 100,
        flags: ['INVALID_AMOUNT'],
      };
    }

    if (bidAmount <= currentHighestBid) {
      return {
        isValid: false,
        reason: 'Bid must be higher than current highest bid',
        riskScore: 0,
        flags: ['TOO_LOW'],
      };
    }

    if (bidAmount > this.MAX_BID_AMOUNT) {
      flags.push('UNUSUALLY_HIGH');
      riskScore += 30;
    }

    // Check bid increment
    const increment = bidAmount - currentHighestBid;
    if (increment < this.MIN_BID_INCREMENT) {
      return {
        isValid: false,
        reason: `Minimum bid increment is $${this.MIN_BID_INCREMENT}`,
        riskScore: 20,
        flags: ['INCREMENT_TOO_SMALL'],
      };
    }

    // Check for suspicious bid velocity
    const recentBids = this.getRecentBids(userId, 60000); // Last minute
    if (recentBids.length >= this.SUSPICIOUS_BID_VELOCITY) {
      flags.push('HIGH_VELOCITY');
      riskScore += 50;
      
      await auditService.logSuspiciousActivity(
        userId,
        'High bid velocity detected',
        { recentBidCount: recentBids.length, timeWindowMs: 60000 }
      );
    }

    // Check for bid pattern anomalies
    if (this.detectBidPatternAnomaly(userId, auctionId, bidAmount)) {
      flags.push('PATTERN_ANOMALY');
      riskScore += 40;
    }

    // Check for self-bidding (bidding on own auction)
    // This would require checking auction ownership - placeholder for now
    // if (this.isSelfBidding(userId, auctionId)) {
    //   flags.push('SELF_BIDDING');
    //   riskScore += 80;
    // }

    // Record the bid
    this.recordBid(userId, auctionId, bidAmount);

    // Determine if bid should be blocked
    const isValid = riskScore < 70; // Threshold for blocking

    if (!isValid) {
      await auditService.logSuspiciousActivity(
        userId,
        'Bid blocked due to high risk score',
        { riskScore, flags, auctionId, bidAmount }
      );
    }

    return {
      isValid,
      reason: isValid ? undefined : 'Bid blocked due to suspicious activity',
      riskScore,
      flags,
    };
  }

  /**
   * Record a bid in history
   */
  private recordBid(userId: string, auctionId: string, amount: number): void {
    const history = this.userBidHistory.get(userId) || [];
    history.push({ timestamp: new Date(), amount, auctionId });
    
    // Keep only last 100 bids
    if (history.length > 100) {
      history.shift();
    }
    
    this.userBidHistory.set(userId, history);
  }

  /**
   * Get recent bids within time window
   */
  private getRecentBids(userId: string, timeWindowMs: number): Array<{ timestamp: Date; amount: number; auctionId: string }> {
    const history = this.userBidHistory.get(userId) || [];
    const cutoff = new Date(Date.now() - timeWindowMs);
    return history.filter(bid => bid.timestamp > cutoff);
  }

  /**
   * Detect bid pattern anomalies
   */
  private detectBidPatternAnomaly(userId: string, auctionId: string, bidAmount: number): boolean {
    const history = this.userBidHistory.get(userId) || [];
    
    if (history.length < 3) {
      return false;
    }

    // Check for rapid-fire bidding on same auction
    const auctionBids = history.filter(bid => bid.auctionId === auctionId);
    if (auctionBids.length >= 3) {
      const lastThree = auctionBids.slice(-3);
      const timeSpan = lastThree[2].timestamp.getTime() - lastThree[0].timestamp.getTime();
      
      // Flag if 3+ bids within 10 seconds on same auction
      if (timeSpan < 10000) {
        return true;
      }
    }

    // Check for round number patterns (e.g., always bidding in multiples of 100)
    const recentAmounts = history.slice(-5).map(b => b.amount);
    const allRoundNumbers = recentAmounts.every(amt => amt % 100 === 0);
    if (allRoundNumbers && recentAmounts.length >= 5) {
      return true;
    }

    return false;
  }

  /**
   * Check if content is spam
   */
  async isSpam(content: string, userId: string): Promise<boolean> {
    // Simple spam detection heuristics
    const spamKeywords = [
      'viagra', 'cialis', 'lottery', 'winner', 'free money',
      'click here', 'limited time', 'act now', 'guarantee',
    ];

    const lowerContent = content.toLowerCase();
    
    // Check for spam keywords
    const hasSpamKeywords = spamKeywords.some(keyword => lowerContent.includes(keyword));
    if (hasSpamKeywords) {
      await auditService.logSuspiciousActivity(
        userId,
        'Spam keywords detected in content',
        { contentLength: content.length }
      );
      return true;
    }

    // Check for excessive capitalization
    const capitalRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capitalRatio > 0.5 && content.length > 10) {
      return true;
    }

    // Check for excessive special characters
    const specialCharRatio = (content.match(/[!@#$%^&*]/g) || []).length / content.length;
    if (specialCharRatio > 0.3) {
      return true;
    }

    // Check for repeated characters
    if (/(.)\1{5,}/.test(content)) {
      return true;
    }

    return false;
  }

  /**
   * Clear old bid history
   */
  cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [userId, history] of this.userBidHistory.entries()) {
      const filtered = history.filter(bid => bid.timestamp > cutoff);
      if (filtered.length === 0) {
        this.userBidHistory.delete(userId);
      } else {
        this.userBidHistory.set(userId, filtered);
      }
    }
  }
}

export const fraudDetectionService = new FraudDetectionService();
