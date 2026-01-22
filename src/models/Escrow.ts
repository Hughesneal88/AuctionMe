import pool from '../config/database';
import { Escrow, CreateEscrowRequest, EscrowStatus } from '../types';
import crypto from 'crypto';

export class EscrowModel {
  /**
   * Generate a unique delivery code
   */
  private static generateDeliveryCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create a new escrow record
   */
  static async create(data: CreateEscrowRequest): Promise<Escrow> {
    const deliveryCode = this.generateDeliveryCode();
    
    const query = `
      INSERT INTO escrow (
        transaction_id, auction_id, buyer_id, seller_id,
        amount, status, delivery_code, locked_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
      RETURNING *
    `;
    
    const values = [
      data.transaction_id,
      data.auction_id,
      data.buyer_id,
      data.seller_id,
      data.amount,
      'held',
      deliveryCode,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find escrow by ID
   */
  static async findById(id: number): Promise<Escrow | null> {
    const query = 'SELECT * FROM escrow WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find escrow by transaction ID
   */
  static async findByTransactionId(transactionId: number): Promise<Escrow | null> {
    const query = 'SELECT * FROM escrow WHERE transaction_id = $1';
    const result = await pool.query(query, [transactionId]);
    return result.rows[0] || null;
  }

  /**
   * Find escrow by auction ID
   */
  static async findByAuctionId(auctionId: number): Promise<Escrow | null> {
    const query = 'SELECT * FROM escrow WHERE auction_id = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await pool.query(query, [auctionId]);
    return result.rows[0] || null;
  }

  /**
   * Find escrow by delivery code
   */
  static async findByDeliveryCode(deliveryCode: string): Promise<Escrow | null> {
    const query = 'SELECT * FROM escrow WHERE delivery_code = $1';
    const result = await pool.query(query, [deliveryCode]);
    return result.rows[0] || null;
  }

  /**
   * Update escrow status
   */
  static async updateStatus(id: number, status: EscrowStatus): Promise<Escrow> {
    const query = `
      UPDATE escrow 
      SET status = $1, 
          released_at = CASE WHEN $1 = 'released' THEN CURRENT_TIMESTAMP ELSE released_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      throw new Error('Escrow not found');
    }
    
    return result.rows[0];
  }

  /**
   * Verify delivery and release escrow
   */
  static async releaseWithDeliveryCode(escrowId: number, deliveryCode: string): Promise<Escrow> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify the delivery code matches
      const verifyQuery = 'SELECT * FROM escrow WHERE id = $1 AND delivery_code = $2 FOR UPDATE';
      const verifyResult = await client.query(verifyQuery, [escrowId, deliveryCode]);
      
      if (verifyResult.rows.length === 0) {
        throw new Error('Invalid escrow ID or delivery code');
      }
      
      const escrow = verifyResult.rows[0];
      
      // Check if escrow is in valid state for release
      if (escrow.status !== 'held' && escrow.status !== 'verified') {
        throw new Error(`Cannot release escrow with status: ${escrow.status}`);
      }
      
      // Update to released status
      const updateQuery = `
        UPDATE escrow 
        SET status = 'released', 
            released_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const updateResult = await client.query(updateQuery, [escrowId]);
      
      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all held escrows (funds locked)
   */
  static async findAllHeld(): Promise<Escrow[]> {
    const query = `
      SELECT * FROM escrow 
      WHERE status = 'held' 
      ORDER BY locked_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}
