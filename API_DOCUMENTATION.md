# AuctionMe API Documentation

An app that allows people to put up stuff for auction on campus and deliver the items to the user.

The money stays in escrow until the seller confirms delivery with the buyers code.

The code is given on delivery or during pickup.

## Features

### Implemented Features

✅ **Auction Listings**
- Create auction listings with title, description, images, starting bid, and duration
- Automatic calculation of end time based on duration
- Track auction status (active, closed, expired)

✅ **Edit Prevention**
- Auctions cannot be edited after the first bid is placed
- Ensures integrity of ongoing auctions

✅ **Browse & Search**
- Pagination support for efficient browsing
- Search by title and description
- Filter by bid range (min/max)
- Filter by seller
- Automatically hides expired auctions

✅ **Bidding System**
- Place bids on active auctions
- Validates bid amount (must be higher than current bid)
- Prevents seller from bidding on own auction
- Tracks bid history with timestamps

✅ **Auction Scheduler**
- Automatic closure of expired auctions
- Runs every minute to check for expired auctions
- Determines winning bid automatically (highest bid, earliest timestamp for ties)
- Updates auction status and sets winner

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)

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

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/auctionme
NODE_ENV=development
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

### Auctions

#### Create Auction

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
    "description": "MacBook Pro 2020, 16GB RAM, 512GB SSD",
    "images": ["url1.jpg", "url2.jpg"],
    "startingBid": 500,
    "currentBid": 500,
    "duration": 24,
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-02T00:00:00.000Z",
    "status": "active",
    "sellerId": "user_id_here",
    "bidCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Browse Auctions

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
GET /api/auctions?page=1&limit=10&search=laptop&minBid=100&maxBid=1000
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "auction_id",
      "title": "Used Laptop",
      "currentBid": 500,
      "status": "active",
      "endTime": "2024-01-02T00:00:00.000Z",
      "sellerId": {
        "_id": "user_id",
        "username": "johndoe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

#### Get Auction by ID

**GET** `/api/auctions/:id`

Get detailed information about a specific auction.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "auction_id",
    "title": "Used Laptop",
    "description": "MacBook Pro 2020",
    "currentBid": 500,
    "bidCount": 5,
    "status": "active",
    "sellerId": {
      "_id": "user_id",
      "username": "johndoe"
    },
    "winnerId": null
  }
}
```

#### Update Auction

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

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "auction_id",
    "title": "Updated Title",
    "description": "Updated description"
  }
}
```

**Error (after first bid):**
```json
{
  "success": false,
  "message": "Cannot edit auction after first bid has been placed"
}
```

#### Close Auction

**POST** `/api/auctions/:id/close`

Manually close an auction and determine the winner. (Usually done automatically by scheduler)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "auction_id",
    "status": "closed",
    "winnerId": "winner_user_id",
    "currentBid": 750
  },
  "message": "Auction closed successfully"
}
```

### Bids

#### Place Bid

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
    "bidderId": "user_id",
    "amount": 550,
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "message": "Bid placed successfully"
}
```

**Error (bid too low):**
```json
{
  "success": false,
  "message": "Bid must be higher than current bid of 500"
}
```

#### Get Auction Bids

**GET** `/api/auctions/:id/bids`

Get all bids for a specific auction.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "bid_id",
      "amount": 750,
      "timestamp": "2024-01-01T02:00:00.000Z",
      "bidderId": {
        "_id": "user_id",
        "username": "janedoe"
      }
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

#### Get Highest Bid

**GET** `/api/auctions/:id/bids/highest`

Get the highest bid for an auction.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "bid_id",
    "amount": 750,
    "timestamp": "2024-01-01T02:00:00.000Z",
    "bidderId": {
      "_id": "user_id",
      "username": "janedoe"
    }
  }
}
```

#### Get User Bids

**GET** `/api/users/:userId/bids`

Get all bids placed by a specific user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "bid_id",
      "amount": 750,
      "timestamp": "2024-01-01T02:00:00.000Z",
      "auctionId": {
        "_id": "auction_id",
        "title": "Used Laptop",
        "status": "active"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

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

The winning bid is determined by:
```javascript
// Highest bid first, earliest timestamp for ties
sort({ amount: -1, timestamp: 1 })
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The project includes:
- **Unit tests** for models (Auction, Bid)
- **Integration tests** for API endpoints
- Tests for:
  - Auction creation and validation
  - Browse and search functionality
  - Edit prevention after first bid
  - Bid placement and validation
  - Auction closure and winner determination

## Project Structure

```
AuctionMe/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── auctionController.js # Auction API handlers
│   │   └── bidController.js     # Bid API handlers
│   ├── models/
│   │   ├── Auction.js          # Auction schema
│   │   ├── Bid.js              # Bid schema
│   │   └── User.js             # User schema
│   ├── routes/
│   │   ├── auctionRoutes.js    # Auction routes
│   │   ├── bidRoutes.js        # Bid routes
│   │   └── index.js            # Route aggregator
│   ├── schedulers/
│   │   └── auctionScheduler.js # Auto-close scheduler
│   ├── services/
│   │   ├── auctionService.js   # Auction business logic
│   │   └── bidService.js       # Bid business logic
│   └── app.js                  # Main application
├── tests/
│   ├── integration/
│   │   └── auction.test.js     # API integration tests
│   └── unit/
│       ├── auction.test.js     # Auction model tests
│       └── bid.test.js         # Bid model tests
├── .env.example                # Environment variables template
├── .gitignore
├── jest.config.js              # Jest configuration
├── package.json
└── Readme.md
```

## Security Considerations

- Input validation on all endpoints
- Helmet.js for security headers
- CORS configuration
- Mongoose schema validation
- Business logic validation (bid amounts, edit permissions, etc.)

## Future Enhancements

- User authentication and authorization
- Image upload functionality
- Real-time bid notifications (WebSockets)
- Email notifications
- Payment integration with escrow
- Delivery code verification system
- Rating and review system
- Search with Elasticsearch
- Caching with Redis

## License

ISC
