# AuctionMe - Payments, Escrow & Transaction Management API

A secure payment and escrow system for campus auctions, ensuring buyer payments are held safely until delivery confirmation.

## Features

- 🔒 **Secure Escrow System**: Buyer payments are locked until delivery confirmation
- 💳 **Mobile Money Integration**: Seamless payment processing via Mobile Money gateway
- 📝 **Transaction Management**: Complete transaction lifecycle tracking
- 🔐 **Delivery Verification**: Code-based delivery confirmation system
- 🚫 **Withdrawal Protection**: Prevents fund withdrawals before delivery confirmation
- 📊 **Balance Tracking**: Real-time seller balance and escrow status

## Architecture

### Models

1. **Transaction**: Records all payment transactions
2. **Escrow**: Manages funds held in escrow with delivery codes

### Services

1. **PaymentService**: Handles Mobile Money API integration
2. **TransactionService**: Manages transaction lifecycle
3. **EscrowService**: Controls escrow operations and fund releases

### API Endpoints

#### Payment Endpoints

- `POST /api/payments/initiate` - Initiate a new payment
- `POST /api/payments/webhook` - Handle payment provider callbacks
- `GET /api/payments/:transactionId` - Get transaction status

#### Escrow Endpoints

- `GET /api/escrow/:escrowId/status` - Get escrow status
- `GET /api/escrow/transaction/:transactionId` - Get escrow by transaction
- `POST /api/escrow/:escrowId/confirm-delivery` - Confirm delivery with code
- `POST /api/escrow/:escrowId/release` - Release funds to seller
- `POST /api/escrow/:escrowId/refund` - Process refund
- `GET /api/escrow/seller/:sellerId/can-withdraw` - Check withdrawal eligibility
- `GET /api/escrow/seller/:sellerId/balance` - Get available balance

## Setup

### Prerequisites

- Node.js 16+ 
- MongoDB 4+
- Mobile Money API credentials

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with:
# - MongoDB connection string
# - Mobile Money API credentials
# - JWT secret
```

### Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/auctionme
JWT_SECRET=your-secret-key
MOBILE_MONEY_API_KEY=your-api-key
MOBILE_MONEY_API_SECRET=your-api-secret
MOBILE_MONEY_WEBHOOK_SECRET=your-webhook-secret
MOBILE_MONEY_BASE_URL=https://api.mobilemoney.com/v1
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Payment Flow

1. **Buyer initiates payment** → Creates transaction record
2. **Payment processed** → Mobile Money gateway handles payment
3. **Webhook received** → Transaction status updated
4. **Escrow created** → Funds locked with delivery code
5. **Item delivered** → Seller enters buyer's delivery code
6. **Delivery confirmed** → Escrow status updated
7. **Funds released** → Payment transferred to seller

## Security Features

- ✅ Webhook signature verification
- ✅ Hashed delivery codes (SHA-256)
- ✅ Timing-safe code comparison
- ✅ Transaction state validation
- ✅ Input validation and sanitization

## API Usage Examples

### Initiate Payment

```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "auctionId": "AUCTION-123",
    "buyerId": "BUYER-456",
    "sellerId": "SELLER-789",
    "amount": 50.00,
    "currency": "USD",
    "phoneNumber": "+1234567890",
    "email": "buyer@example.com"
  }'
```

### Confirm Delivery

```bash
curl -X POST http://localhost:3000/api/escrow/ESC-123/confirm-delivery \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryCode": "123456",
    "confirmedBy": "SELLER-789"
  }'
```

### Check Escrow Status

```bash
curl http://localhost:3000/api/escrow/ESC-123/status
```

## Development

### Project Structure

```
src/
├── models/           # Database models
├── services/         # Business logic
├── controllers/      # Request handlers
├── routes/          # API routes
├── middleware/      # Express middleware
├── config/          # Configuration files
├── utils/           # Helper functions
├── types/           # TypeScript types
└── __tests__/       # Integration tests
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Jest for testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

ISC
