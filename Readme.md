# AuctionMe

An app that allows people to put up stuff for auction on campus and deliver the items to the user.

The money stays in escrow until the seller confirms delivery with the buyer's code. The code is given on delivery or during pickup.

## Features

### Dispute Management System
- **Buyer Dispute Creation**: Buyers can create disputes for items not received, damaged, or not as described
- **Dispute Time Limits**: Configurable time limits for dispute resolution
- **Evidence Support**: Upload evidence (descriptions and images) to support disputes
- **Escrow Locking**: Automatic escrow locking during active disputes

### Admin Panel
- **Dispute Review**: Admins can review and resolve disputes
- **Manual Escrow Control**: Admins can manually release or refund escrow
- **User Management**: Suspend, unsuspend, or ban users
- **Comprehensive Dashboard**: View all disputes, users, and system activity

### Audit & Logging
- **Complete Audit Trail**: All admin actions and dispute activities are logged
- **Searchable Logs**: Filter logs by action, user, date, and resource
- **Resource History**: View complete history for any dispute, escrow, or user

### Security
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Separate permissions for buyers, sellers, and admins
- **Suspended User Protection**: Suspended users cannot perform actions
- **Input Validation**: Comprehensive validation on all endpoints

## Technology Stack

- **Backend**: Node.js with Express and TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest with TypeScript support

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/Hughesneal88/AuctionMe.git
cd AuctionMe
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/auctionme
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
DISPUTE_TIME_LIMIT_DAYS=7
ESCROW_RELEASE_DELAY_HOURS=24
```

4. **Start MongoDB**
```bash
# Using MongoDB service
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Build the project**
```bash
npm run build
```

6. **Run the application**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Documentation

Detailed API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Start API Examples

**Health Check**
```bash
curl http://localhost:3000/health
```

**Create a Dispute** (requires authentication)
```bash
curl -X POST http://localhost:3000/api/disputes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auctionId": "507f1f77bcf86cd799439011",
    "reason": "item_not_received",
    "description": "Item not delivered after 5 days"
  }'
```

**Admin: Resolve Dispute** (requires admin role)
```bash
curl -X POST http://localhost:3000/api/admin/disputes/DISPUTE_ID/resolve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "refund_buyer",
    "resolutionNote": "Item confirmed not delivered"
  }'
```

## Project Structure

```
AuctionMe/
├── src/
│   ├── models/          # Mongoose models
│   │   ├── User.ts
│   │   ├── Auction.ts
│   │   ├── Escrow.ts
│   │   ├── Dispute.ts
│   │   └── AuditLog.ts
│   ├── controllers/     # Request handlers
│   │   ├── disputeController.ts
│   │   └── adminController.ts
│   ├── services/        # Business logic
│   │   ├── disputeService.ts
│   │   ├── escrowService.ts
│   │   ├── adminService.ts
│   │   └── auditLogService.ts
│   ├── routes/          # API routes
│   │   ├── disputeRoutes.ts
│   │   └── adminRoutes.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── types/           # TypeScript types and enums
│   │   └── enums.ts
│   ├── config/          # Configuration
│   │   ├── database.ts
│   │   └── index.ts
│   ├── __tests__/       # Test files
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Key Models

### Dispute
- Tracks buyer disputes for auctions
- Links to auction, escrow, buyer, and seller
- Supports evidence with descriptions and images
- Has time limits and resolution tracking

### Escrow
- Holds payment for auctions
- Can be locked during disputes
- Admin can manually release or refund
- Tracks all state changes

### AuditLog
- Records all system actions
- Tracks who performed actions and when
- Links to affected resources
- Searchable and filterable

### User
- Supports multiple roles (buyer, seller, admin)
- Can be suspended or banned
- Suspension has expiry dates
- Status checked on all authenticated requests

## Security Best Practices

1. **Never commit sensitive data**: Keep `.env` out of version control
2. **Use strong JWT secrets**: Generate secure random strings for production
3. **Validate all inputs**: All endpoints validate request data
4. **Audit all actions**: Every action is logged for accountability
5. **Rate limiting**: Consider adding rate limiting in production
6. **HTTPS**: Always use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For issues or questions, please open an issue on GitHub.



