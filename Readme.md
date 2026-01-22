# AuctionMe

An app that allows people to put up stuff for auction on campus and deliver the items to the user.

The money stays in escrow until the seller confirms delivery with the buyer's code. The code is given on delivery or during pickup.

## Features

- ✅ Unique 6-digit delivery confirmation codes
- ✅ Secure code hashing with bcrypt
- ✅ One-time use enforcement
- ✅ Buyer-only code access
- ✅ Seller delivery confirmation
- ✅ Automatic escrow release after validation
- ✅ Comprehensive test coverage (33 tests)

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

### Testing

```bash
npm test
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

## Quick Example

### 1. Generate Confirmation Code (Buyer)

```bash
curl -X POST http://localhost:3000/api/delivery/generate \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "trans-123",
    "buyerId": "buyer-456"
  }'
```

Response:
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

### 2. Confirm Delivery (Seller)

```bash
curl -X POST http://localhost:3000/api/delivery/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "trans-123",
    "code": "123456",
    "sellerId": "seller-789"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Delivery confirmed successfully"
}
```

### 3. Check Status (Buyer)

```bash
curl -X GET "http://localhost:3000/api/delivery/status/trans-123?buyerId=buyer-456"
```

## Security

- All confirmation codes are hashed using bcrypt (10 rounds)
- Codes are one-time use only
- Only buyers can access their codes
- Only sellers can confirm delivery with valid codes
- Escrow is only released after successful confirmation

## Project Structure

```
src/
├── models/           # Data models and types
├── services/         # Business logic (ConfirmationCodeService)
├── controllers/      # API controllers (DeliveryController)
├── routes/           # Express routes
├── __tests__/        # Test files
└── index.ts          # Application entry point
```

## Testing

The project includes comprehensive tests covering:

- Code generation and uniqueness
- Secure hashing and verification
- One-time use enforcement
- Access control validation
- Transaction status updates
- Escrow release triggers
- API endpoint integration

Run tests with:

```bash
npm test           # Run all tests
npm run test:watch # Watch mode for development
```

## License

ISC

