import { v4 as uuidv4 } from 'uuid';
import { RateLimitRecord } from '../types';

/**
 * In-memory storage for rate limit records (replace with Redis in production)
 */
class RateLimitStore {
  private records: Map<string, RateLimitRecord> = new Map();

  private getKey(userId: string, action: string): string {
    return `${userId}:${action}`;
  }

  get(userId: string, action: string): RateLimitRecord | undefined {
    const key = this.getKey(userId, action);
    const record = this.records.get(key);
    
    // Check if window has expired
    if (record && new Date() > record.windowEnd) {
      this.records.delete(key);
      return undefined;
    }
    
    return record;
  }

  increment(userId: string, action: string, windowMs: number): RateLimitRecord {
    const key = this.getKey(userId, action);
    const existing = this.get(userId, action);

    if (existing) {
      existing.count++;
      this.records.set(key, existing);
      return existing;
    }

    const now = new Date();
    const newRecord: RateLimitRecord = {
      id: uuidv4(),
      userId,
      action,
      count: 1,
      windowStart: now,
      windowEnd: new Date(now.getTime() + windowMs),
    };

    this.records.set(key, newRecord);
    return newRecord;
  }

  reset(userId: string, action: string): void {
    const key = this.getKey(userId, action);
    this.records.delete(key);
  }

  cleanup(): void {
    const now = new Date();
    for (const [key, record] of this.records.entries()) {
      if (now > record.windowEnd) {
        this.records.delete(key);
      }
    }
  }
}

export const rateLimitStore = new RateLimitStore();
