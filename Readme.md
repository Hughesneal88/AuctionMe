# AuctionMe

An app that allows people to put up stuff for auction on campus and deliver the items to the user.

The money stays in escrow until the seller confirms delivery with the buyer's code. The code is given on delivery or during pickup.

## 🔔 Features

### Notifications, Security & Fraud Prevention
- ✅ In-app notification system
- ✅ Email notifications (optional)
- ✅ Rate limiting for bids and payments
- ✅ Delivery code brute-force protection
- ✅ Fake bid and spam prevention
- ✅ Full audit logging

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run in development mode
npm run dev

# Run tests
npm test
```

## Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API documentation, usage examples, and deployment guidelines.

## Tech Stack

- Node.js + TypeScript
- Express.js
- Jest (testing)
- ESLint (linting)

## License

MIT



