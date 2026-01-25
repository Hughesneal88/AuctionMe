# AuctionMe - Complete API Documentation

A comprehensive campus auction platform with real-time bidding, secure payments, and escrow system. The money stays in escrow until the seller confirms delivery with the buyer's code.

## Overview

AuctionMe is a full-featured auction system that includes:
- **Auction Management**: Create, browse, and manage auctions
- **Real-Time Bidding**: Place and track bids with WebSocket updates
- **User Authentication**: Secure registration and verification
- **Payment & Escrow**: Integrated Mobile Money payments with escrow protection
- **Delivery Confirmation**: Code-based delivery verification system

## Features

### ✅ Auction Listings & Management
- Create auction listings with title, description, images, starting bid, and duration
- Automatic calculation of end time based on duration
- Track auction status (active, closed, expired)
- Edit prevention after first bid is placed
- Automatic closure of expired auctions via scheduler

### ✅ Browse & Search
- Pagination support for efficient browsing
- Search by title and description
- Filter by bid range (min/max)
- Filter by seller
- Automatically hides expired auctions

### ✅ Bidding System
- Place bids on active auctions
- Real-time bid updates via WebSocket
- Validates bid amount (must be higher than current bid)
- Prevents seller from bidding on own auction
- Tracks bid history with timestamps
- Determines winning bid automatically (highest bid, earliest timestamp for ties)

### ✅ User Authentication & Authorization
- User registration with campus email domain validation
- Email verification flow
- JWT-based authentication (login/logout)
- Refresh token support
- Block unverified users from protected features
- User profile management (name, phone, campus location)
- Authorization middleware for protected routes

### ✅ Payment & Escrow System
- 🔒 Secure escrow: Buyer payments locked until delivery confirmation
- 💳 Mobile Money integration: Seamless payment processing
- 📝 Transaction management: Complete lifecycle tracking
- 🔐 Delivery verification: Code-based confirmation
- 🚫 Withdrawal protection: Prevents fund withdrawals before delivery
- 📊 Balance tracking: Real-time seller balance and escrow status

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- Mobile Money API credentials (for payments)
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
- `GET /api/escrow/buyer/:buyerId` - Get buyer's escrows 🔒
- `GET /api/escrow/:escrowId/delivery-code` - Get delivery code 🔒 (Buyer only)
- `POST /api/escrow/:escrowId/confirm-delivery` - Confirm delivery with code (auto-releases funds)
- `POST /api/escrow/:escrowId/release` - Manually release funds to seller
- `POST /api/escrow/:escrowId/refund` - Process refund
- `GET /api/escrow/seller/:sellerId/can-withdraw` - Check withdrawal eligibility
- `GET /api/escrow/seller/:sellerId/balance` - Get available balance

🔒 = Requires authentication

## Setup

### Prerequisites

- Node.js 16+ 
- MongoDB 4+
- Mobile Money API credentials

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Hughesneal88/AuctionMe.git
cd AuctionMe
```

2. Install dependencies:
```bash
# Install dependencies
npm install

3. Create a `.env` file based on `.env.example`:
```bash
# Copy environment variables
cp .env.example .env

# Configure your .env file with:
# - MongoDB connection string
# - Mobile Money API credentials
# - JWT secret
```

4. Configure environment variables in `.env`:
```
### Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/auctionme
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
MOBILE_MONEY_API_KEY=your-api-key
MOBILE_MONEY_API_SECRET=your-api-secret
MOBILE_MONEY_WEBHOOK_SECRET=your-webhook-secret
MOBILE_MONEY_BASE_URL=https://api.mobilemoney.com/v1
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

5. Start MongoDB (if not already running):
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using local installation
mongod
```

6. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
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

## API Endpoints

### Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "AuctionMe API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Auction Endpoints

### Create Auction

**POST** `/api/auctions`

Create a new auction listing.

**Request Body:**
```json
{
  "title": "Used Laptop",
  "description": "MacBook Pro 2020, 16GB RAM, 512GB SSD",
  "images": ["url1.jpg", "url2.jpg"],
  "startingBid": 500,
  "duration": 24,
  "sellerId": "user_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "auction_id",
    "title": "Used Laptop",
    "currentBid": 500,
    "status": "active",
    "endTime": "2024-01-02T00:00:00.000Z"
  }
}
```

### Browse Auctions

**GET** `/api/auctions`

Browse and search auctions with pagination and filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search in title and description
- `minBid` (optional): Minimum current bid
- `maxBid` (optional): Maximum current bid
- `sellerId` (optional): Filter by seller

**Example:**
```
GET /api/auctions?page=1&limit=10&search=laptop&minBid=100
```

### Get Auction by ID

**GET** `/api/auctions/:id`

Get detailed information about a specific auction.

### Update Auction

**PUT** `/api/auctions/:id`

Update auction details. Can only be done before the first bid.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "userId": "seller_user_id"
}
```

**Error (after first bid):**
```json
{
  "success": false,
  "message": "Cannot edit auction after first bid has been placed"
}
```

### Close Auction

**POST** `/api/auctions/:id/close`

Manually close an auction and determine the winner.

---

## Bidding Endpoints

### Place Bid

**POST** `/api/auctions/:id/bids`

Place a bid on an auction.

**Request Body:**
```json
{
  "amount": 550,
  "bidderId": "user_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "bid_id",
    "auctionId": "auction_id",
    "amount": 550,
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "message": "Bid placed successfully"
}
```

### Get Auction Bids

**GET** `/api/auctions/:id/bids`

Get all bids for a specific auction with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### Get Highest Bid

**GET** `/api/auctions/:id/bids/highest`

Get the highest bid for an auction.

### Get User Bids

**GET** `/api/users/:userId/bids`

Get all bids placed by a specific user.

---

## User Authentication Endpoints

### Register

**POST** `/api/auth/register`

Register a new user with campus email.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

### Verify Email

**POST** `/api/auth/verify-email`

Verify user email with verification code.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "code": "123456"
}
```

### Login

**POST** `/api/auth/login`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "_id": "user_id",
      "email": "student@university.edu",
      "name": "John Doe"
    }
  }
}
```

### Logout

**POST** `/api/auth/logout`

Logout user and invalidate refresh token.

### Refresh Token

**POST** `/api/auth/refresh`

Get new access token using refresh token.

### Get Profile

**GET** `/api/users/profile`

Get current user profile (requires authentication).

### Update Profile

**PUT** `/api/users/profile`

Update user profile information.

---

## Payment Endpoints

### Initiate Payment

**POST** `/api/payments/initiate`

Initiate a new payment for an auction.

**Request Body:**
```json
{
  "auctionId": "auction_id",
  "amount": 1000,
  "phoneNumber": "+256700000000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_id",
    "status": "PENDING",
    "message": "Payment initiated. Please complete on your phone."
  }
}
```

### Payment Webhook

**POST** `/api/payments/webhook`

Handle payment provider callbacks (internal use).

### Get Transaction Status

**GET** `/api/payments/:transactionId`

Get the status of a payment transaction.

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_id",
    "status": "COMPLETED",
    "amount": 1000,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Escrow Endpoints

### Get Escrow Status

**GET** `/api/escrow/:escrowId/status`

Get current escrow status.

**Response:**
```json
{
  "success": true,
  "data": {
    "escrowId": "ESC-123456789",
    "status": "LOCKED",
    "amount": 1000,
    "currency": "USD",
    "buyerId": "buyer_id",
    "sellerId": "seller_id",
    "confirmedAt": null,
    "releasedAt": null
  }
}
```

> **Note:** The delivery code (hashed and encrypted) is never exposed in API responses for security.

### Get Escrow by Transaction

**GET** `/api/escrow/transaction/:transactionId`

Get escrow details by transaction ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "escrowId": "ESC-123456789",
    "transactionId": "TXN-987654321",
    "status": "LOCKED",
    "amount": 1000
  }
}
```

### Get Buyer's Escrows (🔒 Authenticated)

**GET** `/api/escrow/buyer/:buyerId`

Get all escrows for a specific buyer.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Authorization:** User must be authenticated and can only access their own escrows.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "escrowId": "ESC-123456789",
      "transactionId": "TXN-987654321",
      "auctionId": "AUCTION-001",
      "status": "LOCKED",
      "amount": 1000,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Delivery Code (🔒 Authenticated Buyer Only)

**GET** `/api/escrow/:escrowId/delivery-code`

Retrieve the delivery confirmation code for an escrow. Only the buyer can access this.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Authorization:** 
- User must be authenticated
- User must be the buyer for the specified escrow
- Code is only available for escrows in LOCKED status

**Response:**
```json
{
  "success": true,
  "data": {
    "escrowId": "ESC-123456789",
    "deliveryCode": "123456",
    "message": "Share this code with the seller to confirm delivery. This code can only be used once."
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the buyer for this escrow
- `400 Bad Request`: Code no longer available (already used or escrow not in LOCKED state)

### Confirm Delivery

**POST** `/api/escrow/:escrowId/confirm-delivery`

Confirm delivery with buyer's verification code. By default, automatically releases funds to seller.

**Rate Limiting:** Strict rate limiting applied due to security sensitivity.

**Request Body:**
```json
{
  "deliveryCode": "123456",
  "confirmedBy": "seller_id",
  "autoRelease": true
}
```

**Parameters:**
- `deliveryCode` (required): The 6-digit code provided by the buyer
- `confirmedBy` (required): ID of the person confirming delivery (typically seller)
- `autoRelease` (optional, default: true): If true, automatically releases funds after confirmation

**Response (Auto-Release Enabled):**
```json
{
  "success": true,
  "message": "Delivery confirmed and funds released successfully",
  "data": {
    "escrowId": "ESC-123456789",
    "status": "RELEASED",
    "confirmedAt": "2024-01-15T14:30:00Z",
    "releasedAt": "2024-01-15T14:30:00Z"
  }
}
```

**Response (Auto-Release Disabled):**
```json
{
  "success": true,
  "message": "Delivery confirmed successfully",
  "data": {
    "escrowId": "ESC-123456789",
    "status": "PENDING_CONFIRMATION",
    "confirmedAt": "2024-01-15T14:30:00Z",
    "releasedAt": null
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid delivery code, escrow not in LOCKED state, or missing required fields

**Security Notes:**
- Each delivery code can only be used once
- The encrypted delivery code is automatically cleared after successful confirmation
- Failed attempts are rate-limited to prevent brute force attacks

### Release Funds

**POST** `/api/escrow/:escrowId/release`

Manually release funds to seller. Required only if auto-release was disabled during delivery confirmation.

**Request:** No body required

**Response:**
```json
{
  "success": true,
  "message": "Funds released successfully",
  "data": {
    "escrowId": "ESC-123456789",
    "status": "RELEASED",
    "releasedAt": "2024-01-15T14:35:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Delivery must be confirmed before releasing funds"
}
```

### Process Refund

**POST** `/api/escrow/:escrowId/refund`

Process refund to buyer (admin/internal use).

**Request Body:**
```json
{
  "reason": "Item not delivered"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "escrowId": "ESC-123456789",
    "status": "REFUNDED",
    "refundedAt": "2024-01-15T15:00:00Z"
  }
}
```

### Check Withdrawal Eligibility

**GET** `/api/escrow/seller/:sellerId/can-withdraw`

Check if seller can withdraw funds (no locked or pending escrows).

**Response:**
```json
{
  "success": true,
  "data": {
    "canWithdraw": true,
    "message": "Withdrawal allowed"
  }
}
```

### Get Available Balance

**GET** `/api/escrow/seller/:sellerId/balance`

Get seller's available balance (released funds).

**Response:**
```json
{
  "success": true,
  "data": {
    "sellerId": "seller_id",
    "availableBalance": 5000
  }
}
```

---

## Delivery Confirmation Code System

### Overview

The delivery confirmation code system ensures secure transactions between buyers and sellers:

1. **Code Generation**: When payment completes, a unique 6-digit code is generated
2. **Secure Storage**: Code is hashed (SHA256) for verification and encrypted (AES-256-GCM) for buyer retrieval
3. **Buyer Notification**: Code is sent to buyer via notification system (SMS/Email in production)
4. **Buyer Access**: Buyer can retrieve code via authenticated API endpoint
5. **Delivery Confirmation**: Seller requests code from buyer to confirm delivery
6. **Automatic Release**: Funds automatically released to seller upon successful confirmation
7. **One-Time Use**: Code is cleared after first successful use

### Security Features

- **Cryptographically Secure**: Uses Node.js crypto module for code generation
- **Hashed Storage**: SHA256 hashing with timing-safe comparison
- **Encrypted Retrieval**: AES-256-GCM encryption for buyer code access
- **Authentication Required**: Buyer endpoints require JWT authentication
- **Authorization Checks**: Users can only access their own codes
- **Rate Limiting**: Strict rate limiting on confirmation endpoint
- **One-Time Use**: Encrypted code automatically cleared after confirmation

### Status Flow

```
Payment Completed
    ↓
Escrow Created (LOCKED)
    ↓
Seller Gets Code from Buyer
    ↓
Seller Confirms Delivery
    ↓
Escrow Released (RELEASED) ← Automatic by default
```

Alternative flow without auto-release:
```
Payment Completed
    ↓
Escrow Created (LOCKED)
    ↓
Seller Confirms Delivery
    ↓
Pending Confirmation (PENDING_CONFIRMATION)
    ↓
Manual Release Triggered
    ↓
Escrow Released (RELEASED)
```

---

## Automatic Auction Closure

The system includes an automated scheduler that:

1. Runs every minute (configurable in `src/schedulers/auctionScheduler.js`)
2. Checks for auctions where `endTime` has passed and status is still `active`
3. Closes expired auctions automatically
4. Determines the winner based on:
   - Highest bid amount
   - Earliest timestamp in case of tie
5. Updates auction status to `closed` and sets `winnerId`

### Winning Bid Logic

```javascript
// Highest bid first, earliest timestamp for ties
Bid.findOne({ auctionId })
  .sort({ amount: -1, timestamp: 1 })
  .limit(1)
```

---

## Real-Time Updates (WebSocket)

The system supports real-time updates via Socket.IO for:
- New bid notifications
- Auction status changes
- Outbid notifications
- Winner announcements

### Connect to WebSocket

```javascript
const socket = io('http://localhost:3000');

// Join auction room
socket.emit('join-auction', { auctionId: 'auction_id' });

// Listen for new bids
socket.on('new-bid', (data) => {
  console.log('New bid:', data);
});

// Listen for auction closed
socket.on('auction-closed', (data) => {
  console.log('Auction closed:', data);
});
```

---

## Business Rules

1. ✅ Sellers cannot bid on their own auctions
2. ✅ Bids must be higher than current bid
3. ✅ Auctions cannot be edited after first bid
4. ✅ Only active, non-expired auctions shown in browse
5. ✅ Winner is highest bidder (earliest for ties)
6. ✅ Auctions auto-close at end time
7. ✅ Payments held in escrow until delivery confirmation
8. ✅ Delivery code required to release funds
9. ✅ Email verification required for protected features

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage

The project includes:
- **Unit tests** for models (Auction, Bid, User, Escrow, Transaction)
- **Integration tests** for API endpoints
- **E2E tests** for complete user flows
- Tests for:
  - Auction creation and validation
  - Browse and search functionality
  - Edit prevention after first bid
  - Bid placement and validation
  - Auction closure and winner determination
  - Payment processing
  - Escrow management
  - Delivery confirmation

---

## Security Considerations

- Input validation on all endpoints
- Helmet.js for security headers
- CORS configuration
- Mongoose schema validation
- Business logic validation
- JWT authentication with refresh tokens
- Email verification for campus users
- Rate limiting on API endpoints
- Secure delivery code generation
- Webhook signature verification for payments

---
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
- ✅ Rate limiting on all endpoints
  - Payment initiation: 10 requests per 15 minutes
  - Webhooks: 60 requests per minute
  - General endpoints: 100 requests per 15 minutes
  - Sensitive operations (delivery confirmation, fund release): 5 requests per hour

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
AuctionMe/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── controllers/
│   │   ├── auctionController.ts # Auction API handlers
│   │   ├── bidController.ts     # Bid API handlers
│   │   ├── authController.ts    # Authentication handlers
│   │   ├── paymentController.ts # Payment handlers
│   │   └── escrowController.ts  # Escrow handlers
│   ├── models/
│   │   ├── Auction.ts          # Auction schema
│   │   ├── Bid.ts              # Bid schema
│   │   ├── User.ts             # User schema
│   │   ├── Transaction.ts      # Transaction schema
│   │   ├── Escrow.ts           # Escrow schema
│   │   └── Notification.ts     # Notification schema
│   ├── routes/
│   │   ├── auctionRoutes.ts    # Auction routes
│   │   ├── bidRoutes.ts        # Bid routes
│   │   ├── authRoutes.ts       # Auth routes
│   │   ├── paymentRoutes.ts    # Payment routes
│   │   └── escrowRoutes.ts     # Escrow routes
│   ├── schedulers/
│   │   └── auctionScheduler.ts # Auto-close scheduler
│   ├── services/
│   │   ├── auctionService.ts   # Auction business logic
│   │   ├── bidService.ts       # Bid business logic
│   │   ├── authService.ts      # Auth business logic
│   │   ├── paymentService.ts   # Payment integration
│   │   ├── escrowService.ts    # Escrow management
│   │   ├── transactionService.ts # Transaction management
│   │   ├── notificationService.ts # Notifications
│   │   └── webSocketService.ts # WebSocket handling
│   ├── middleware/
│   │   ├── auth.ts             # Authentication middleware
│   │   └── rateLimiter.ts      # Rate limiting
│   └── app.ts                  # Main application
├── tests/
│   ├── integration/
│   │   ├── auction.test.ts     # Auction API tests
│   │   ├── payment.integration.test.ts
│   │   └── escrow.integration.test.ts
│   └── unit/
│       ├── auction.test.ts     # Auction model tests
│       ├── bid.test.ts         # Bid model tests
│       └── escrow.test.ts      # Escrow model tests
├── .env.example                # Environment variables template
├── .gitignore
├── jest.config.js              # Jest configuration
├── package.json
└── README.md
```

---
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

- Image upload to cloud storage (AWS S3/Cloudinary)
- Push notifications for mobile apps
- Advanced search with Elasticsearch
- Caching with Redis
- Rating and review system
- Dispute resolution system
- Multi-currency support
- Auction categories and tags
- Watchlist functionality
- Automated bidding (proxy bidding)

---
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

---

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/Hughesneal88/AuctionMe).
## License

ISC
