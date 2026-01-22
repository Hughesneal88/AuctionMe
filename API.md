# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Currently, the API does not require authentication. In production, implement JWT or session-based authentication.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T12:00:00.000Z"
}
```

---

### 2. Place a Bid

**POST** `/api/bids`

Place a new bid on an auction.

**Request Body**
```json
{
  "auctionId": "550e8400-e29b-41d4-a716-446655440000",
  "bidderId": "660e8400-e29b-41d4-a716-446655440000",
  "amount": 150
}
```

**Parameters**
- `auctionId` (string, required) - UUID of the auction
- `bidderId` (string, required) - UUID of the bidder
- `amount` (number, required) - Bid amount (must be positive)

**Success Response (201)**
```json
{
  "success": true,
  "bid": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "auctionId": "550e8400-e29b-41d4-a716-446655440000",
    "bidderId": "660e8400-e29b-41d4-a716-446655440000",
    "amount": 150,
    "timestamp": "2026-01-22T12:00:00.000Z"
  },
  "message": "Bid placed successfully"
}
```

**Error Responses**

**400 - Missing Fields**
```json
{
  "error": "Missing required fields: auctionId, bidderId, amount"
}
```

**400 - Invalid Amount**
```json
{
  "error": "Amount must be a positive number"
}
```

**400 - Auction Not Found**
```json
{
  "error": "Auction not found"
}
```

**400 - Auction Not Active**
```json
{
  "error": "Auction is not active"
}
```

**400 - Auction Has Ended**
```json
{
  "error": "Auction has ended"
}
```

**400 - Self-Bidding**
```json
{
  "error": "Sellers cannot bid on their own auctions"
}
```

**400 - Below Minimum Increment**
```json
{
  "error": "Bid must be at least 160 (current bid: 150, minimum increment: 10)"
}
```

---

### 3. Get Bids for Auction

**GET** `/api/bids/auction/:auctionId`

Retrieve all bids for a specific auction.

**URL Parameters**
- `auctionId` (string) - UUID of the auction

**Success Response (200)**
```json
{
  "success": true,
  "bids": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "auctionId": "550e8400-e29b-41d4-a716-446655440000",
      "bidderId": "660e8400-e29b-41d4-a716-446655440000",
      "amount": 150,
      "timestamp": "2026-01-22T12:00:00.000Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "auctionId": "550e8400-e29b-41d4-a716-446655440000",
      "bidderId": "990e8400-e29b-41d4-a716-446655440000",
      "amount": 140,
      "timestamp": "2026-01-22T11:55:00.000Z"
    }
  ],
  "count": 2
}
```

**Notes**
- Bids are sorted by timestamp (newest first)
- Returns empty array if no bids exist

---

### 4. Get Highest Bid

**GET** `/api/bids/auction/:auctionId/highest`

Get the current highest bid for an auction.

**URL Parameters**
- `auctionId` (string) - UUID of the auction

**Success Response (200)**
```json
{
  "success": true,
  "bid": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "auctionId": "550e8400-e29b-41d4-a716-446655440000",
    "bidderId": "660e8400-e29b-41d4-a716-446655440000",
    "amount": 150,
    "timestamp": "2026-01-22T12:00:00.000Z"
  }
}
```

**Error Response (404)**
```json
{
  "error": "No bids found for this auction"
}
```

---

### 5. Get Bids by Bidder

**GET** `/api/bids/bidder/:bidderId`

Retrieve all bids placed by a specific user.

**URL Parameters**
- `bidderId` (string) - UUID of the bidder

**Success Response (200)**
```json
{
  "success": true,
  "bids": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "auctionId": "550e8400-e29b-41d4-a716-446655440000",
      "bidderId": "660e8400-e29b-41d4-a716-446655440000",
      "amount": 150,
      "timestamp": "2026-01-22T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3000');
```

### Client → Server Events

#### Join Auction Room
```javascript
socket.emit('join-auction', 'auction-uuid');
```
Join a room to receive real-time updates for a specific auction.

#### Leave Auction Room
```javascript
socket.emit('leave-auction', 'auction-uuid');
```
Leave an auction room to stop receiving updates.

#### Join User Room
```javascript
socket.emit('join-user', 'user-uuid');
```
Join a personal room to receive notifications.

### Server → Client Events

#### New Bid
```javascript
socket.on('new-bid', (data) => {
  console.log(data);
});
```

**Data Structure**
```json
{
  "auctionId": "550e8400-e29b-41d4-a716-446655440000",
  "bid": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "auctionId": "550e8400-e29b-41d4-a716-446655440000",
    "bidderId": "660e8400-e29b-41d4-a716-446655440000",
    "amount": 150,
    "timestamp": "2026-01-22T12:00:00.000Z"
  },
  "timestamp": "2026-01-22T12:00:00.000Z"
}
```

#### Notification
```javascript
socket.on('notification', (notification) => {
  console.log(notification);
});
```

**Notification Structure**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440000",
  "type": "OUTBID",
  "message": "You have been outbid on \"Test Item\". New bid: $150",
  "auctionId": "550e8400-e29b-41d4-a716-446655440000",
  "read": false,
  "createdAt": "2026-01-22T12:00:00.000Z"
}
```

**Notification Types**
- `OUTBID` - User has been outbid
- `AUCTION_WON` - User won the auction
- `AUCTION_LOST` - User lost the auction
- `BID_PLACED` - New bid placed on seller's auction

#### Auction Closed
```javascript
socket.on('auction-closed', (data) => {
  console.log(data);
});
```

**Data Structure**
```json
{
  "auctionId": "550e8400-e29b-41d4-a716-446655440000",
  "winnerId": "660e8400-e29b-41d4-a716-446655440000",
  "winningBid": 150,
  "timestamp": "2026-01-22T12:00:00.000Z"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created (bid placed successfully) |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting in production to prevent:
- Bid spamming
- DoS attacks
- API abuse

Recommended: 10 bid requests per minute per user

---

## Testing

Use the provided test suite to validate API behavior:

```bash
npm test
```

Or use tools like:
- **Postman** - For API testing
- **Socket.IO Client** - For WebSocket testing
- **curl** - For command-line testing

### Example curl Request

```bash
# Place a bid
curl -X POST http://localhost:3000/api/bids \
  -H "Content-Type: application/json" \
  -d '{
    "auctionId": "550e8400-e29b-41d4-a716-446655440000",
    "bidderId": "660e8400-e29b-41d4-a716-446655440000",
    "amount": 150
  }'

# Get bids for auction
curl http://localhost:3000/api/bids/auction/550e8400-e29b-41d4-a716-446655440000

# Health check
curl http://localhost:3000/health
```
