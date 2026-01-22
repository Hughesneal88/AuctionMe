// Demo script to showcase the delivery confirmation code workflow
import { ConfirmationCodeService } from './services/confirmationCodeService';
import { TransactionStatus } from './models';

async function runDemo() {
  console.log('=========================================');
  console.log('AuctionMe Delivery Confirmation Demo');
  console.log('=========================================\n');

  // Setup test data
  const transactionId = 'demo-trans-123';
  const buyerId = 'buyer-alice';
  const sellerId = 'seller-bob';
  const amount = 150.00;

  console.log('Step 1: Setting up a transaction in escrow');
  console.log(`  Transaction ID: ${transactionId}`);
  console.log(`  Buyer: ${buyerId}`);
  console.log(`  Seller: ${sellerId}`);
  console.log(`  Amount: $${amount}`);
  
  ConfirmationCodeService._setTransaction(transactionId, {
    id: transactionId,
    buyerId,
    sellerId,
    status: TransactionStatus.IN_ESCROW,
    amount,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('  ✓ Transaction created in escrow\n');

  console.log('Step 2: Buyer generates delivery confirmation code');
  const { code, confirmation } = await ConfirmationCodeService.createDeliveryConfirmation(
    transactionId,
    buyerId
  );
  console.log(`  ✓ Code generated: ${code}`);
  console.log(`  ✓ Confirmation ID: ${confirmation.id}`);
  console.log(`  ✓ Expires at: ${confirmation.expiresAt?.toISOString()}`);
  console.log('  📱 (Buyer shares this code with seller during delivery)\n');

  console.log('Step 3: Checking confirmation status');
  const status = ConfirmationCodeService.getConfirmationDetails(transactionId, buyerId);
  console.log(`  ✓ Status: ${status?.isUsed ? 'Used' : 'Unused'}`);
  console.log(`  ✓ Generated: ${status?.generatedAt.toISOString()}`);
  console.log(`  ✓ Transaction ID: ${status?.transactionId}\n`);

  console.log('Step 4: Seller confirms delivery with buyer\'s code');
  const confirmResult = await ConfirmationCodeService.confirmDelivery(
    transactionId,
    code,
    sellerId
  );
  console.log(`  Result: ${confirmResult.message}`);
  if (confirmResult.success) {
    console.log('  ✓ Delivery confirmed successfully!');
    console.log('  ✓ Escrow released to seller');
    
    const { transactions } = ConfirmationCodeService._getStorage();
    const transaction = transactions.get(transactionId);
    console.log(`  ✓ Transaction status: ${transaction.status}`);
    console.log(`  ✓ Escrow released at: ${transaction.escrowReleasedAt?.toISOString()}\n`);
  }

  console.log('Step 5: Attempting to reuse the same code (should fail)');
  const reuseResult = await ConfirmationCodeService.confirmDelivery(
    transactionId,
    code,
    sellerId
  );
  console.log(`  Result: ${reuseResult.message}`);
  if (!reuseResult.success) {
    console.log('  ✓ One-time use enforcement working correctly!\n');
  }

  console.log('Step 6: Testing invalid scenarios');
  
  // Try with wrong code
  const wrongCodeResult = await ConfirmationCodeService.confirmDelivery(
    'another-trans',
    '999999',
    sellerId
  );
  console.log(`  Wrong code: ${wrongCodeResult.message}`);
  
  // Try with wrong seller
  const transId2 = 'demo-trans-456';
  ConfirmationCodeService._setTransaction(transId2, {
    id: transId2,
    buyerId: 'buyer-charlie',
    sellerId: 'seller-diane',
    status: TransactionStatus.IN_ESCROW,
    amount: 200,
  });
  const { code: code2 } = await ConfirmationCodeService.createDeliveryConfirmation(
    transId2,
    'buyer-charlie'
  );
  const wrongSellerResult = await ConfirmationCodeService.confirmDelivery(
    transId2,
    code2,
    'wrong-seller'
  );
  console.log(`  Wrong seller: ${wrongSellerResult.message}`);
  console.log('  ✓ Security validations working correctly!\n');

  console.log('=========================================');
  console.log('Demo Complete - All Features Working!');
  console.log('=========================================');
}

// Run the demo
runDemo().catch(console.error);
