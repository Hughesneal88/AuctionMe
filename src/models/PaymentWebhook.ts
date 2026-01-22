import pool from '../config/database';
import { PaymentWebhook, PaymentProvider } from '../types';

export class PaymentWebhookModel {
  /**
   * Create a new webhook log entry
   */
  static async create(
    provider: PaymentProvider,
    eventType: string,
    payload: Record<string, any>,
    transactionId?: number
  ): Promise<PaymentWebhook> {
    const query = `
      INSERT INTO payment_webhooks (
        provider, event_type, transaction_id, payload, processed
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      provider,
      eventType,
      transactionId,
      JSON.stringify(payload),
      false,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Mark webhook as processed
   */
  static async markAsProcessed(id: number): Promise<PaymentWebhook> {
    const query = `
      UPDATE payment_webhooks 
      SET processed = true, 
          processed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Webhook not found');
    }
    
    return result.rows[0];
  }

  /**
   * Get unprocessed webhooks
   */
  static async findUnprocessed(limit = 100): Promise<PaymentWebhook[]> {
    const query = `
      SELECT * FROM payment_webhooks 
      WHERE processed = false 
      ORDER BY created_at ASC 
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}
