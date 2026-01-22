# AuctionMe

An app that allows people to put up stuff for auction on campus and deliver the items to the user.

The money stays in escrow until the seller confirms delivery with the buyers code.

The code is given on delivery or during pickup.

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
