# AuctionMe

An app that allows people to put up stuff for auction on campus and deliver the items to the user.

The money stays in escrow until the seller confirms delivery with the buyer's code.

The code is given on delivery or during pickup.

## Features

✅ **Secure Payment Integration** - Mobile Money (Flutterwave/M-Pesa)  
✅ **Escrow System** - Funds locked until delivery confirmation  
✅ **Transaction Management** - Complete payment lifecycle tracking  
✅ **Delivery Verification** - Unique codes for secure fund release  
✅ **Real-time Webhooks** - Instant payment status updates  
✅ **Rate Limited APIs** - Protection against abuse  
✅ **Comprehensive Tests** - 29 tests, 100% passing  

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
psql -U postgres -c "CREATE DATABASE auctionme;"
psql -U postgres -d auctionme -f src/config/schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Build and run
npm run build
npm run dev
```

Server runs on `http://localhost:3000`

## Documentation

- **[Setup Guide](./SETUP_GUIDE.md)** - Complete installation instructions
- **[API Documentation](./API_DOCUMENTATION.md)** - Detailed API reference

## Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Testing**: Jest
- **Security**: Helmet, Rate Limiting, Idempotency Keys

## API Endpoints

### Transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/initiate` - Initiate payment
- `GET /api/transactions/:id/verify` - Verify payment

### Escrow
- `GET /api/escrow/:id` - Get escrow status
- `POST /api/escrow/:id/release` - Release funds (requires delivery code)
- `POST /api/escrow/:id/refund` - Refund to buyer

### Webhooks
- `POST /api/webhooks/payment` - Payment status callback

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start
```

## Security

- ✅ Rate limiting on all endpoints
- ✅ SQL injection prevention
- ✅ Idempotency key support
- ✅ Webhook signature verification
- ✅ 0 CodeQL vulnerabilities

## License

ISC
