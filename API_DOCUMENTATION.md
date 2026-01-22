# AuctionMe - Delivery Confirmation API Documentation

## Overview

The Delivery Confirmation API provides secure delivery verification for auction transactions using one-time use confirmation codes. When a buyer wins an auction and payment is held in escrow, a unique 6-digit confirmation code is generated for the buyer. The seller must provide this code to confirm delivery, triggering the release of escrow funds.

## Security Features

- **6-digit unique codes**: Randomly generated confirmation codes
- **Secure hashing**: Codes are hashed using bcrypt before storage
- **One-time use**: Codes can only be used once
- **Buyer-only access**: Only the buyer can view their confirmation code
- **Seller validation**: Only the seller can confirm delivery with the buyer's code
- **Automatic escrow release**: Funds are released upon successful confirmation

## API Endpoints

### 1. Generate Confirmation Code

Generate a unique delivery confirmation code for a transaction.

**Endpoint:** `POST /api/delivery/generate`

**Access:** Buyer only

**Request Body:**
```json
{
  "transactionId": "string",
  "buyerId": "string"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Confirmation code generated successfully",
  "data": {
    "code": "123456",
    "confirmationId": "uuid",
    "expiresAt": "2026-01-25T11:58:47.236Z"
  }
}
```

**Error Responses:**
- `400`: Missing parameters, transaction not found, transaction not in escrow, buyer ID mismatch, or code already exists

**Notes:**
- The code is only displayed once when generated
- Transaction must be in `IN_ESCROW` status
- Code expires after 72 hours (configurable)
- Only one code can exist per transaction

---

### 2. Confirm Delivery

Confirm delivery using the buyer's confirmation code.

**Endpoint:** `POST /api/delivery/confirm`

**Access:** Seller only

**Request Body:**
```json
{
  "transactionId": "string",
  "code": "123456",
  "sellerId": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Delivery confirmed successfully"
}
```

**Error Responses:**
- `400`: Missing parameters, invalid code format, wrong code, code already used, seller ID mismatch, or expired code

**Notes:**
- Code must be exactly 6 digits
- Code can only be used once
- Triggers automatic escrow release
- Updates transaction status to `COMPLETED`

---

### 3. Get Confirmation Status

Get the status of a delivery confirmation (without revealing the code).

**Endpoint:** `GET /api/delivery/status/:transactionId`

**Access:** Buyer only

**Query Parameters:**
- `buyerId`: string (required)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transactionId": "string",
    "buyerId": "string",
    "generatedAt": "2026-01-22T11:58:47.236Z",
    "expiresAt": "2026-01-25T11:58:47.236Z",
    "usedAt": null,
    "isUsed": false
  }
}
```

**Error Responses:**
- `400`: Missing parameters
- `404`: Confirmation not found or access denied

**Notes:**
- Does not return the actual code or code hash
- Only accessible by the buyer who owns the transaction

---

## Workflow Example

1. **Buyer wins auction**
   - Payment is placed in escrow
   - Transaction status: `IN_ESCROW`

2. **Generate confirmation code**
   ```bash
   POST /api/delivery/generate
   {
     "transactionId": "trans-123",
     "buyerId": "buyer-456"
   }
   ```
   - Buyer receives: `{ "code": "123456", ... }`
   - Buyer provides code to seller during delivery/pickup

3. **Seller confirms delivery**
   ```bash
   POST /api/delivery/confirm
   {
     "transactionId": "trans-123",
     "code": "123456",
     "sellerId": "seller-789"
   }
   ```
   - Code is validated
   - Transaction status updated to `COMPLETED`
   - Escrow funds released to seller

4. **Check status (optional)**
   ```bash
   GET /api/delivery/status/trans-123?buyerId=buyer-456
   ```
   - Returns confirmation status and usage details

## Transaction Status Flow

```
PENDING_PAYMENT → PAYMENT_RECEIVED → IN_ESCROW → 
AWAITING_DELIVERY → DELIVERED → COMPLETED
```

- Confirmation code can only be generated when status is `IN_ESCROW`
- Successful confirmation moves status to `DELIVERED` then `COMPLETED`
- Escrow is released when status reaches `COMPLETED`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error scenarios:
- Transaction not found
- Transaction not in correct status
- Access denied (wrong buyer/seller ID)
- Code already exists
- Code already used (one-time use enforcement)
- Invalid code
- Expired code

## Security Considerations

1. **Code Storage**: Codes are hashed using bcrypt (10 rounds) before storage
2. **One-time Use**: Codes are marked as used after successful confirmation
3. **Access Control**: 
   - Only buyers can generate and view their codes
   - Only sellers can confirm delivery with codes
4. **Validation**: Strict validation on transaction status, user roles, and code format
5. **No Code Exposure**: Status endpoint does not reveal the actual code

## Testing

Run tests with:
```bash
npm test
```

Test coverage includes:
- Code generation and uniqueness
- Secure hashing and verification
- One-time use enforcement
- Access control validation
- Transaction status updates
- Escrow release triggers
- API endpoint integration tests
