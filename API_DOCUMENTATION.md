# AuctionMe - Payment, Escrow & Transaction Management API

A secure payment and escrow system for campus auction platform built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

✅ **Mobile Money Payment Integration** (Flutterwave/M-Pesa)  
✅ **Secure Escrow System** - Funds locked until delivery confirmation  
✅ **Transaction Management** - Full transaction lifecycle tracking  
✅ **Payment Webhooks** - Real-time payment status updates  
✅ **Delivery Code Verification** - Secure fund release mechanism  
✅ **Idempotency Support** - Prevent duplicate payments  
✅ **Comprehensive Tests** - Unit tests for models and services  

## Architecture

```
src/
├── config/          # Database configuration and schema
├── models/          # Data models (Transaction, Escrow, PaymentWebhook)
├── services/        # Business logic (TransactionService, EscrowService, PaymentGatewayService)
├── controllers/     # API controllers
├── routes/          # API routes
├── types/           # TypeScript type definitions
└── index.ts         # Express application entry point
```

## Installation

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Hughesneal88/AuctionMe.git
cd AuctionMe
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=auctionme
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

PORT=3000
NODE_ENV=development

FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_WEBHOOK_HASH=your_webhook_hash

APP_BASE_URL=http://localhost:3000
```

4. Set up the database:
```bash
# Create database
psql -U postgres -c "CREATE DATABASE auctionme;"

# Run schema
psql -U postgres -d auctionme -f src/config/schema.sql
```

5. Build and run:
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Transactions

**Create Transaction**
```http
POST /transactions
Content-Type: application/json
Idempotency-Key: unique-key-123

{
  "user_id": 123,
  "auction_id": 456,
  "amount": 100.00,
  "currency": "USD",
  "payment_method": "mobile_money",
  "payment_provider": "flutterwave"
}
```

**Initiate Payment**
```http
POST /transactions/initiate
Content-Type: application/json

{
  "transaction_id": 1,
  "email": "buyer@example.com",
  "phone_number": "+1234567890",
  "redirect_url": "https://example.com/callback"
}
```

**Verify Payment**
```http
GET /transactions/:transaction_id/verify
```

**Get Transaction**
```http
GET /transactions/:transaction_id
```

**Get User Transactions**
```http
GET /transactions/user/:user_id?limit=50
```

#### Escrow

**Get Escrow**
```http
GET /escrow/:escrow_id
```

**Get Escrow by Auction**
```http
GET /escrow/auction/:auction_id
```

**Verify Delivery**
```http
POST /escrow/:escrow_id/verify
Content-Type: application/json

{
  "delivery_code": "123456"
}
```

**Release Escrow**
```http
POST /escrow/:escrow_id/release
Content-Type: application/json

{
  "delivery_code": "123456"
}
```

**Refund Escrow**
```http
POST /escrow/:escrow_id/refund
Content-Type: application/json

{
  "reason": "Order cancelled by buyer"
}
```

**Dispute Escrow**
```http
POST /escrow/:escrow_id/dispute
Content-Type: application/json

{
  "reason": "Item not as described"
}
```

**Check Withdrawal Eligibility**
```http
POST /escrow/withdrawal/check
Content-Type: application/json

{
  "seller_id": 20,
  "amount": 500.00
}
```

**Get All Held Escrows** (Admin)
```http
GET /escrow/held/all
```

#### Webhooks

**Payment Webhook**
```http
POST /webhooks/payment
Content-Type: application/json
X-Webhook-Signature: signature_from_provider

{
  "event": "charge.completed",
  "provider": "flutterwave",
  "transaction_id": "TXN-123",
  "status": "success"
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Escrow Flow

1. **Payment Initiation**: Buyer initiates payment for won auction
2. **Payment Processing**: Payment gateway processes the transaction
3. **Escrow Creation**: Upon successful payment, funds are locked in escrow
4. **Delivery Code Generation**: System generates a unique 6-digit delivery code
5. **Item Delivery**: Seller delivers item and shares delivery code with buyer
6. **Verification**: Buyer confirms receipt using the delivery code
7. **Fund Release**: System releases funds to seller

## Security Features

- **Idempotency Keys**: Prevent duplicate transactions
- **Webhook Signature Verification**: Validate payment provider callbacks
- **Delivery Code Authentication**: Secure fund release mechanism
- **Database Transactions**: ACID compliance for escrow operations
- **Input Validation**: Prevent SQL injection and XSS attacks
- **Helmet.js**: Security headers for HTTP responses

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Database Schema

### Tables

- **users**: User accounts
- **auctions**: Auction listings
- **transactions**: Payment transactions
- **escrow**: Escrow records with delivery codes
- **payment_webhooks**: Payment webhook logs

See `src/config/schema.sql` for complete schema.

## Development

### Adding New Payment Providers

1. Extend `PaymentGatewayService` in `src/services/PaymentGatewayService.ts`
2. Add provider-specific configuration to `.env`
3. Implement provider's API calls in `initiatePayment` and `verifyPayment`
4. Update webhook handler to process provider-specific events

### Running in Development

```bash
npm run dev
```

This starts the server with hot-reload using nodemon.

## Production Considerations

1. **Database Connection Pooling**: Configure pool size based on load
2. **Payment Provider Integration**: Replace mock implementation with actual API calls
3. **Authentication & Authorization**: Add JWT/OAuth for API endpoints
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Logging**: Use structured logging (e.g., Winston, Pino)
6. **Monitoring**: Set up application monitoring (e.g., New Relic, Datadog)
7. **Database Backups**: Regular automated backups
8. **SSL/TLS**: Enable HTTPS for all endpoints
9. **Environment Variables**: Use secure secret management (e.g., AWS Secrets Manager)

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
