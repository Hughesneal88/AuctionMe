# AuctionMe - Real-Time Bidding System

An app that allows people to put up stuff for auction on campus and deliver the items to the user. The money stays in escrow until the seller confirms delivery with the buyers code.

## Features

### ✅ Implemented
- **Bid Model & Database Relations** - Complete data models for Users, Auctions, Bids, and Notifications
- **Bid Placement API** - RESTful API endpoints for placing and retrieving bids
- **Bid Validation**
  - Validates bid increments
  - Prevents self-bidding (sellers can't bid on their own auctions)
  - Checks auction status (active/closed)
  - Validates minimum bid amounts
  - Time-based validation (auction start/end times)
- **Real-Time Updates** - WebSocket support using Socket.IO for instant bid updates
- **Notification System**
  - Notifies users when outbid
  - Notifies winner on auction close
  - Notifies losers on auction close
  - Real-time delivery via WebSocket

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **Testing**: Jest with ts-jest
- **Database**: In-memory (ready for PostgreSQL/MongoDB integration)

## Project Structure

```
src/
├── models/           # Data models (User, Auction, Bid, Notification)
├── services/         # Business logic
│   ├── bidService.ts           # Bid placement and validation
│   ├── notificationService.ts  # Notification management
│   ├── auctionService.ts       # Auction lifecycle management
│   └── webSocketService.ts     # Real-time communication
├── controllers/      # API request handlers
│   └── bidController.ts
├── routes/          # API route definitions
│   └── bidRoutes.ts
├── utils/           # Utilities and helpers
│   └── database.ts  # In-memory database
├── __tests__/       # Test files
└── app.ts           # Application setup

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```

### Place a Bid
```
POST /api/bids
Content-Type: application/json

{
  "auctionId": "uuid",
  "bidderId": "uuid",
  "amount": 150
}
```

**Response**: 
- `201` - Bid placed successfully
- `400` - Validation error (invalid amount, self-bidding, below increment, etc.)
- `500` - Server error

### Get Bids for an Auction
```
GET /api/bids/auction/:auctionId
```

Returns all bids for a specific auction, sorted by timestamp (newest first).

### Get Highest Bid
```
GET /api/bids/auction/:auctionId/highest
```

Returns the current highest bid for an auction.

### Get Bids by Bidder
```
GET /api/bids/bidder/:bidderId
```

Returns all bids placed by a specific user.

## WebSocket Events

### Client → Server Events

**Join Auction Room**
```javascript
socket.emit('join-auction', auctionId);
```

**Leave Auction Room**
```javascript
socket.emit('leave-auction', auctionId);
```

**Join User Room** (for personal notifications)
```javascript
socket.emit('join-user', userId);
```

### Server → Client Events

**New Bid Notification**
```javascript
socket.on('new-bid', (data) => {
  // data: { auctionId, bid, timestamp }
});
```

**User Notification**
```javascript
socket.on('notification', (notification) => {
  // notification: { id, userId, type, message, auctionId, read, createdAt }
});
```

**Auction Closed**
```javascript
socket.on('auction-closed', (data) => {
  // data: { auctionId, winnerId, winningBid, timestamp }
});
```

## Bid Validation Rules

1. **Auction Must Exist**: The auction ID must be valid
2. **Auction Must Be Active**: Status must be `ACTIVE`
3. **Time Constraints**: Current time must be between auction start and end times
4. **No Self-Bidding**: Sellers cannot bid on their own auctions
5. **Valid Bidder**: Bidder must exist in the system
6. **Minimum Increment**: Bid must meet or exceed `currentBid + minBidIncrement`

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Example Usage

### Client-Side Example (JavaScript)

```javascript
import io from 'socket.io-client';

// Connect to WebSocket server
const socket = io('http://localhost:3000');

// Join an auction room
const auctionId = 'auction-uuid';
socket.emit('join-auction', auctionId);

// Listen for new bids
socket.on('new-bid', (data) => {
  console.log('New bid placed:', data.bid.amount);
  // Update UI with new bid
});

// Join user room for notifications
const userId = 'user-uuid';
socket.emit('join-user', userId);

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('Notification:', notification.message);
  // Show notification to user
});

// Place a bid
fetch('http://localhost:3000/api/bids', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    auctionId: 'auction-uuid',
    bidderId: 'user-uuid',
    amount: 150
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('Bid placed successfully!');
  }
});
```

## Data Models

### User
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  createdAt: Date;
}
```

### Auction
```typescript
{
  id: string;
  sellerId: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid: number;
  minBidIncrement: number;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Bid
```typescript
{
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
}
```

### Notification
```typescript
{
  id: string;
  userId: string;
  type: 'OUTBID' | 'AUCTION_WON' | 'AUCTION_LOST' | 'BID_PLACED';
  message: string;
  auctionId: string;
  read: boolean;
  createdAt: Date;
}
```

## Security Considerations

- Input validation on all API endpoints
- Business logic validation (prevent self-bidding, validate increments)
- WebSocket authentication should be implemented for production
- CORS is currently set to allow all origins (`*`) - restrict in production
- Consider rate limiting for bid placement to prevent abuse

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization
- Payment processing integration
- Automatic auction closing scheduler
- Email notifications
- Bid history and analytics
- Auction search and filtering
- Image uploads for auction items

## License

ISC
