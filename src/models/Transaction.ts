import pool from '../config/database';
import { Transaction, CreateTransactionRequest, TransactionStatus } from '../types';

export class TransactionModel {
  /**
   * Create a new transaction
   */
  static async create(data: CreateTransactionRequest): Promise<Transaction> {
    const query = `
      INSERT INTO transactions (
        user_id, auction_id, amount, currency, payment_method,
        payment_provider, transaction_type, status, idempotency_key, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.auction_id,
      data.amount,
      data.currency || 'USD',
      data.payment_method,
      data.payment_provider,
      data.transaction_type,
      'pending',
      data.idempotency_key,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Transaction with this idempotency key already exists');
      }
      throw error;
    }
  }

  /**
   * Find transaction by ID
   */
  static async findById(id: number): Promise<Transaction | null> {
    const query = 'SELECT * FROM transactions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find transaction by idempotency key
   */
  static async findByIdempotencyKey(key: string): Promise<Transaction | null> {
    const query = 'SELECT * FROM transactions WHERE idempotency_key = $1';
    const result = await pool.query(query, [key]);
    return result.rows[0] || null;
  }

  /**
   * Update transaction status
   */
  static async updateStatus(
    id: number,
    status: TransactionStatus,
    providerTransactionId?: string
  ): Promise<Transaction> {
    const query = `
      UPDATE transactions 
      SET status = $1, 
          provider_transaction_id = COALESCE($2, provider_transaction_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, providerTransactionId, id]);
    
    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return result.rows[0];
  }

  /**
   * Get transactions by user ID
   */
  static async findByUserId(userId: number, limit = 50): Promise<Transaction[]> {
    const query = `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Get transaction by auction ID
   */
  static async findByAuctionId(auctionId: number): Promise<Transaction[]> {
    const query = `
      SELECT * FROM transactions 
      WHERE auction_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [auctionId]);
    return result.rows;
  }
}
