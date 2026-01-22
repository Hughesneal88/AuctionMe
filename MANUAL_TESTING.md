# Manual Testing Guide for AuctionMe API

This guide provides step-by-step instructions to manually test all features of the AuctionMe API.

## Prerequisites

1. MongoDB running locally or via Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Server running:
```bash
npm run dev
```

## Test Scenarios

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected: `{"success":true,"message":"AuctionMe API is running","timestamp":"..."}`

---

### 2. Create Test Users

First, we need to create users (seller and bidder) directly in MongoDB or via a script.

Using mongosh:
```bash
mongosh

use auctionme

db.users.insertMany([
  {
    username: "seller1",
    email: "seller1@test.com",
    role: "seller",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    username: "bidder1", 
    email: "bidder1@test.com",
    role: "buyer",
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

Save the IDs returned for use in the following tests.

---

### 3. Create Auction

Replace `SELLER_ID` with actual seller ID:

```bash
curl -X POST http://localhost:3000/api/auctions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "MacBook Pro 2020",
    "description": "Used MacBook Pro 16-inch, 16GB RAM, 512GB SSD. Excellent condition.",
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "startingBid": 800,
    "duration": 24,
    "sellerId": "SELLER_ID"
  }'
```

Expected: Status 201, auction object with `_id`, `status: "active"`, `currentBid: 800`

Save the auction ID for next tests.

---

### 4. Browse Auctions (All Active)

```bash
curl http://localhost:3000/api/auctions
```

Expected: List of active auctions with pagination info

---

### 5. Browse with Pagination

```bash
curl "http://localhost:3000/api/auctions?page=1&limit=5"
```

Expected: First 5 auctions

---

### 6. Search Auctions

```bash
curl "http://localhost:3000/api/auctions?search=macbook"
```

Expected: Auctions matching "macbook" in title or description

---

### 7. Filter by Price Range

```bash
curl "http://localhost:3000/api/auctions?minBid=500&maxBid=1000"
```

Expected: Auctions with current bid between 500 and 1000

---

### 8. Get Single Auction

Replace `AUCTION_ID`:

```bash
curl http://localhost:3000/api/auctions/AUCTION_ID
```

Expected: Detailed auction information

---

### 9. Update Auction (Before First Bid)

Replace `AUCTION_ID` and `SELLER_ID`:

```bash
curl -X PUT http://localhost:3000/api/auctions/AUCTION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "MacBook Pro 2020 - Updated",
    "description": "Updated description",
    "userId": "SELLER_ID"
  }'
```

Expected: Status 200, updated auction

---

### 10. Place First Bid

Replace `AUCTION_ID` and `BIDDER_ID`:

```bash
curl -X POST http://localhost:3000/api/auctions/AUCTION_ID/bids \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 850,
    "bidderId": "BIDDER_ID"
  }'
```

Expected: Status 201, bid created, message "Bid placed successfully"

---

### 11. Try to Update After First Bid (Should Fail)

Replace `AUCTION_ID` and `SELLER_ID`:

```bash
curl -X PUT http://localhost:3000/api/auctions/AUCTION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Should not update",
    "userId": "SELLER_ID"
  }'
```

Expected: Status 400, error "Cannot edit auction after first bid has been placed"

---

### 12. Place Another Bid (Higher)

Replace `AUCTION_ID` and `BIDDER_ID`:

```bash
curl -X POST http://localhost:3000/api/auctions/AUCTION_ID/bids \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 900,
    "bidderId": "BIDDER_ID"
  }'
```

Expected: Status 201, bid created

---

### 13. Try to Place Lower Bid (Should Fail)

```bash
curl -X POST http://localhost:3000/api/auctions/AUCTION_ID/bids \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 850,
    "bidderId": "BIDDER_ID"
  }'
```

Expected: Status 400, error "Bid must be higher than current bid of 900"

---

### 14. Seller Tries to Bid on Own Auction (Should Fail)

Replace with seller's ID as bidderId:

```bash
curl -X POST http://localhost:3000/api/auctions/AUCTION_ID/bids \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "bidderId": "SELLER_ID"
  }'
```

Expected: Status 400, error "Seller cannot bid on their own auction"

---

### 15. Get All Bids for Auction

```bash
curl http://localhost:3000/api/auctions/AUCTION_ID/bids
```

Expected: List of bids sorted by timestamp (newest first)

---

### 16. Get Highest Bid

```bash
curl http://localhost:3000/api/auctions/AUCTION_ID/bids/highest
```

Expected: The highest bid (900)

---

### 17. Get User's Bids

```bash
curl http://localhost:3000/api/users/BIDDER_ID/bids
```

Expected: All bids placed by this user

---

### 18. Create Expired Auction (For Testing Auto-Close)

Create an auction that ends in 1 minute:

```bash
curl -X POST http://localhost:3000/api/auctions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quick Test Auction",
    "description": "This will expire in 1 minute",
    "startingBid": 50,
    "duration": 0.0167,
    "sellerId": "SELLER_ID"
  }'
```

Note: duration is in hours, so 0.0167 hours = 1 minute

Place a bid on it, wait 1-2 minutes, then check:

```bash
curl http://localhost:3000/api/auctions
```

The expired auction should not appear in the list.

---

### 19. Manually Close Auction (Admin/Testing)

```bash
curl -X POST http://localhost:3000/api/auctions/AUCTION_ID/close
```

Expected: Auction status changes to "closed", winnerId is set to highest bidder

---

### 20. Verify Closed Auction

```bash
curl http://localhost:3000/api/auctions/AUCTION_ID
```

Expected: Status "closed", winnerId populated, auction still viewable but not in browse list

---

## Testing the Automatic Scheduler

1. Create an auction with short duration (e.g., 2 minutes)
2. Place at least one bid
3. Wait for the duration to pass
4. Check server logs - you should see:
   ```
   Found 1 expired auction(s)
   Closed auction [ID] - Winner: [WINNER_ID]
   ```
5. Verify the auction is closed:
   ```bash
   curl http://localhost:3000/api/auctions/AUCTION_ID
   ```
   Expected: status "closed", winnerId set

---

## Expected Behaviors

### Auction Lifecycle
1. **Created**: status = "active", no bids
2. **First Bid**: firstBidTime set, can no longer edit
3. **More Bids**: currentBid increases, bidCount increases
4. **Expired**: endTime passes, scheduler closes it
5. **Closed**: status = "closed", winner determined

### Winner Determination
- Highest bid amount wins
- If multiple bids have same amount, earliest timestamp wins
- If no bids, auction closes with no winner

### Browse Behavior
- Only shows active auctions
- Automatically hides expired auctions (endTime < now)
- Supports search, filters, pagination
- Closed auctions don't appear in browse

---

## Troubleshooting

### "Auction not found"
- Check that auction ID is correct
- Verify auction exists in database

### "Cannot edit auction after first bid"
- This is expected behavior after any bid is placed
- Only affects UPDATE operations, not viewing or bidding

### "Bid must be higher than current bid"
- Check current bid amount first
- New bid must be strictly greater than current bid

### Scheduler not closing auctions
- Check server logs for errors
- Verify scheduler is started (look for "Starting auction scheduler...")
- Ensure MongoDB connection is active

---

## Clean Up

To reset the database:

```bash
mongosh

use auctionme
db.auctions.deleteMany({})
db.bids.deleteMany({})
db.users.deleteMany({})
```
