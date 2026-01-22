# AuctionMe

An app that allows people to put up stuff for auction on campus and deliver the items to the user.

The money stays in escrow until the seller confirms delivery with the buyers code.

The code is given on delivery or during pickup.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Hughesneal88/AuctionMe.git
cd AuctionMe
```

2. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

Or manually:
```bash
npm install
cp .env.example .env
```

3. Start MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your local MongoDB installation
```

4. Update `.env` with your configuration

5. Start the server:
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

6. Test the API:
```bash
curl http://localhost:3000/health
```

## ✨ Features

### Implemented
- ✅ **Auction Listings**: Create, view, update auctions with full details
- ✅ **Edit Prevention**: Auctions locked after first bid
- ✅ **Browse & Search**: Pagination, filtering, search functionality
- ✅ **Bidding System**: Place and track bids with validation
- ✅ **Auto-Close Scheduler**: Automatic auction closure and winner determination
- ✅ **Hide Expired**: Expired auctions automatically hidden from browse

### Coming Soon
- 🔜 User authentication and authorization
- 🔜 Image upload functionality
- 🔜 Real-time notifications
- 🔜 Payment integration with escrow
- 🔜 Delivery code verification

## 📚 Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Key Endpoints
- `POST /api/auctions` - Create auction
- `GET /api/auctions` - Browse auctions
- `GET /api/auctions/:id` - Get auction details
- `PUT /api/auctions/:id` - Update auction (before first bid)
- `POST /api/auctions/:id/bids` - Place bid
- `GET /api/auctions/:id/bids` - Get auction bids

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

**Note**: Tests require MongoDB to be running.

## 📁 Project Structure

```
AuctionMe/
├── src/
│   ├── config/         # Configuration (database)
│   ├── controllers/    # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── schedulers/     # Cron jobs
│   ├── services/       # Business logic
│   └── app.js         # Main application
├── tests/
│   ├── integration/   # API tests
│   └── unit/          # Model tests
└── API_DOCUMENTATION.md
```

## 🔒 Security

- ✅ No security vulnerabilities in dependencies
- ✅ CodeQL security analysis passed
- ✅ Input validation on all endpoints
- ✅ Helmet.js security headers
- ✅ Business logic validation

## 📝 Acceptance Criteria Status

### From Issue #1: Auction Listings, Browsing & Scheduling

#### Tasks Completed:
- ✅ Listing schema (title, description, images, starting bid, duration)
- ✅ Create auction listing API
- ✅ Prevent editing after first bid
- ✅ Browse & search auctions (pagination, filters)
- ✅ Hide expired auctions
- ✅ Auction scheduler (auto-close on end time)
- ✅ Determine winning bid automatically

#### Acceptance Criteria Met:
- ✅ **Auctions close automatically**: Scheduler runs every minute to close expired auctions
- ✅ **Winning bidder is correctly selected**: Highest bid wins (earliest timestamp for ties)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

ISC


## Features Implemented

✅ **User Authentication & Authorization**
- User registration with campus email domain validation
- Email verification flow
- JWT-based authentication (login/logout)
- Refresh token support
- Block unverified users from bidding or listing
- Secure password hashing with bcrypt

✅ **User Profiles**
- User profile model (name, phone, campus location)
- Profile fetch and update APIs
- Authorization middleware for protected routes

## Tech Stack

- **Backend**: Node.js with Express.js and TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Testing**: Jest + Supertest

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone and install:
```bash
git clone <repository-url>
cd AuctionMe
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run the application:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

4. Run tests:
```bash
npm test
```

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Security Guide](./SECURITY.md) - Security implementation and best practices

## API Overview

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user

### User Profile Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Example Protected Routes
- `POST /api/marketplace/listings` - Create listing (requires verification)
- `POST /api/marketplace/listings/:id/bids` - Place bid (requires verification)
- `GET /api/marketplace/my-listings` - Get user's listings (requires auth)

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Email verification requirement
- ✅ Campus email domain validation
- ✅ Refresh token rotation
- ✅ Protected routes with middleware
- ✅ Secure token storage

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
└── index.ts         # Entry point

tests/               # Test files
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Environment Variables

Key environment variables (see `.env.example` for all):

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/auctionme
JWT_SECRET=your-secret-key
CAMPUS_EMAIL_DOMAIN=@university.edu
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@example.com
```

## License

ISC
