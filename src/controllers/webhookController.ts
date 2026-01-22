import { Request, Response } from 'express';
import { PaymentWebhookModel } from '../models/PaymentWebhook';
import { TransactionService } from '../services/TransactionService';
import { EscrowService } from '../services/EscrowService';
import { PaymentGatewayService } from '../services/PaymentGatewayService';

const transactionService = new TransactionService();
const escrowService = new EscrowService();
const paymentGateway = new PaymentGatewayService();

/**
 * Handle payment webhook from payment provider
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const payload = req.body;

    // Verify webhook signature (security measure)
    // In production, uncomment this:
    // if (!signature || !paymentGateway.verifyWebhookSignature(JSON.stringify(payload), signature)) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid webhook signature',
    //   });
    // }

    // Log webhook
    const webhook = await PaymentWebhookModel.create(
      payload.provider || 'flutterwave',
      payload.event || 'charge.completed',
      payload
    );

    console.log('Webhook received:', {
      webhook_id: webhook.id,
      event: payload.event,
      provider: payload.provider,
    });

    // Process webhook based on event type
    if (payload.event === 'charge.completed' || payload.status === 'success') {
      const providerTransactionId = payload.transaction_id || payload.tx_ref;
      
      if (providerTransactionId) {
        try {
          // Update transaction status
          const transaction = await transactionService.processPaymentCallback(
            providerTransactionId,
            'success',
            payload
          );

          // Create escrow if transaction has auction_id
          if (transaction.auction_id) {
            try {
              await escrowService.getEscrowByAuction(transaction.auction_id);
            } catch {
              // Create escrow if it doesn't exist
              await escrowService.createEscrow({
                transaction_id: transaction.id,
                auction_id: transaction.auction_id,
                buyer_id: transaction.user_id,
                seller_id: 1, // Mock - should come from auction
                amount: transaction.amount,
              });
            }
          }

          // Mark webhook as processed
          await PaymentWebhookModel.markAsProcessed(webhook.id);
        } catch (error) {
          console.error('Error processing webhook:', error);
        }
      }
    }

    // Always return 200 to acknowledge webhook receipt
    res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    // Return 200 even on error to prevent webhook retries
    res.status(200).json({
      success: false,
      message: error.message || 'Webhook processing failed',
    });
  }
};
