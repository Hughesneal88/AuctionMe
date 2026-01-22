/**
 * Example Usage of AuctionMe Payment & Escrow System
 * 
 * This file demonstrates the complete flow of the escrow system:
 * 1. Create a transaction
 * 2. Initiate payment
 * 3. Process payment callback (webhook simulation)
 * 4. Create escrow after successful payment
 * 5. Release escrow with delivery code
 */

import { TransactionService } from './services/TransactionService';
import { EscrowService } from './services/EscrowService';
import crypto from 'crypto';

// Initialize services
const transactionService = new TransactionService();
const escrowService = new EscrowService();

/**
 * Example: Complete auction payment and escrow flow
 */
async function exampleAuctionFlow() {
  console.log('=== AuctionMe Payment & Escrow Flow ===\n');

  // Step 1: Create a transaction
  console.log('Step 1: Creating transaction...');
  const transaction = await transactionService.createTransaction({
    user_id: 123, // Buyer ID
    auction_id: 456, // Auction ID
    amount: 250.00,
    currency: 'USD',
    payment_method: 'mobile_money',
    payment_provider: 'flutterwave',
    transaction_type: 'payment',
    idempotency_key: crypto.randomUUID(),
    metadata: {
      item_name: 'MacBook Pro 2020',
      auction_end_date: new Date().toISOString(),
    },
  });
  console.log('✓ Transaction created:', {
    id: transaction.id,
    amount: transaction.amount,
    status: transaction.status,
  });
  console.log();

  // Step 2: Initiate payment
  console.log('Step 2: Initiating payment...');
  const paymentResult = await transactionService.initiatePayment(
    transaction.id,
    'buyer@example.com',
    '+1234567890',
    'https://example.com/callback'
  );
  console.log('✓ Payment initiated:', {
    status: paymentResult.transaction.status,
    payment_link: paymentResult.payment_link,
  });
  console.log();

  // Step 3: Simulate successful payment (webhook callback)
  console.log('Step 3: Processing payment callback...');
  const verifiedTransaction = await transactionService.verifyPayment(transaction.id);
  console.log('✓ Payment verified:', {
    status: verifiedTransaction.status,
    provider_transaction_id: verifiedTransaction.provider_transaction_id,
  });
  console.log();

  // Step 4: Create escrow
  console.log('Step 4: Creating escrow...');
  const escrow = await escrowService.createEscrow({
    transaction_id: verifiedTransaction.id,
    auction_id: 456,
    buyer_id: 123,
    seller_id: 789,
    amount: verifiedTransaction.amount,
    metadata: {
      auction_title: 'MacBook Pro 2020',
    },
  });
  console.log('✓ Escrow created:', {
    id: escrow.id,
    status: escrow.status,
    delivery_code: escrow.delivery_code,
    locked_at: escrow.locked_at,
  });
  console.log();

  // Step 5: Seller delivers item and shares delivery code
  console.log('Step 5: Verifying delivery...');
  const verifiedEscrow = await escrowService.verifyDelivery(
    escrow.id,
    escrow.delivery_code
  );
  console.log('✓ Delivery verified:', {
    id: verifiedEscrow.id,
    status: verifiedEscrow.status,
  });
  console.log();

  // Step 6: Release escrow to seller
  console.log('Step 6: Releasing escrow...');
  const releasedEscrow = await escrowService.releaseEscrow(
    escrow.id,
    escrow.delivery_code
  );
  console.log('✓ Escrow released:', {
    id: releasedEscrow.id,
    status: releasedEscrow.status,
    released_at: releasedEscrow.released_at,
  });
  console.log();

  console.log('=== Flow Complete ===');
  console.log('✅ Buyer paid $250.00');
  console.log('✅ Funds held in escrow');
  console.log('✅ Delivery confirmed with code');
  console.log('✅ Funds released to seller');
}

/**
 * Example: Check withdrawal eligibility
 */
async function exampleWithdrawalCheck() {
  console.log('\n=== Withdrawal Eligibility Check ===\n');

  const sellerId = 789;
  const requestedAmount = 100.00;

  const canWithdraw = await escrowService.canWithdraw(sellerId, requestedAmount);
  
  console.log('Seller ID:', sellerId);
  console.log('Requested Amount:', `$${requestedAmount}`);
  console.log('Can Withdraw:', canWithdraw ? '✅ Yes' : '❌ No (funds locked in escrow)');
}

/**
 * Example: Handle dispute
 */
async function exampleDispute() {
  console.log('\n=== Escrow Dispute Example ===\n');

  // Assume escrow ID 1 exists
  const escrowId = 1;
  const reason = 'Item not as described in auction listing';

  try {
    const disputedEscrow = await escrowService.disputeEscrow(escrowId, reason);
    console.log('✓ Escrow disputed:', {
      id: disputedEscrow.id,
      status: disputedEscrow.status,
      reason: reason,
    });
    console.log('Note: Admin review required for dispute resolution');
  } catch (error: any) {
    console.log('Error:', error.message);
  }
}

/**
 * Example: Get all held escrows (admin function)
 */
async function exampleGetHeldEscrows() {
  console.log('\n=== Held Escrows Report (Admin) ===\n');

  const heldEscrows = await escrowService.getAllHeldEscrows();
  
  if (heldEscrows.length === 0) {
    console.log('No escrows currently held');
  } else {
    console.log(`Total Held Escrows: ${heldEscrows.length}`);
    heldEscrows.forEach((escrow, index) => {
      console.log(`\n${index + 1}. Escrow #${escrow.id}`);
      console.log(`   Amount: $${escrow.amount}`);
      console.log(`   Buyer: User #${escrow.buyer_id}`);
      console.log(`   Seller: User #${escrow.seller_id}`);
      console.log(`   Locked Since: ${escrow.locked_at}`);
    });
  }
}

// Export examples for use
export {
  exampleAuctionFlow,
  exampleWithdrawalCheck,
  exampleDispute,
  exampleGetHeldEscrows,
};

/**
 * Run example if executed directly
 * 
 * Usage:
 *   ts-node src/examples.ts
 * 
 * Note: Requires database connection to be configured in .env
 */
if (require.main === module) {
  console.log('Note: These examples use mock data and require database connection.\n');
  console.log('For actual usage, ensure:');
  console.log('1. PostgreSQL is running');
  console.log('2. Database is created and schema is loaded');
  console.log('3. .env file is configured\n');
  
  // Uncomment to run examples:
  // exampleAuctionFlow().catch(console.error);
  // exampleWithdrawalCheck().catch(console.error);
  // exampleDispute().catch(console.error);
  // exampleGetHeldEscrows().catch(console.error);
}
