# AuctionMe API Documentation

An app that allows people to put up stuff for auction on campus and deliver the items to the user. The money stays in escrow until the seller confirms delivery with the buyer's code.

## Features

### User Authentication & Authorization
- ✅ User registration with campus email domain validation
- ✅ Email verification flow
- ✅ JWT-based authentication (login/logout)
- ✅ Refresh token support
- ✅ Block unverified users from protected features
- ✅ User profile management (name, phone, campus location)
- ✅ Authorization middleware for protected routes

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **Testing**: Jest + Supertest

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AuctionMe
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/auctionme
JWT_SECRET=your-secret-key
CAMPUS_EMAIL_DOMAIN=@university.edu
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
```

### Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

### Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## API Endpoints

### Authentication Endpoints

#### Register a new user
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "_id": "...",
    "email": "student@university.edu",
    "name": "John Doe",
    "isVerified": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Verify email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully",
  "user": {
    "_id": "...",
    "email": "student@university.edu",
    "name": "John Doe",
    "isVerified": true
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "...",
    "email": "student@university.edu",
    "name": "John Doe",
    "isVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Get current user
```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "...",
    "email": "student@university.edu",
    "name": "John Doe",
    "phone": "1234567890",
    "campusLocation": "Building A",
    "isVerified": true
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

#### Refresh access token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Resend verification email
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "student@university.edu"
}
```

**Response (200 OK):**
```json
{
  "message": "Verification email sent"
}
```

### User Profile Endpoints

All profile endpoints require authentication (Bearer token in Authorization header).

#### Get user profile
```http
GET /api/users/profile
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "...",
    "email": "student@university.edu",
    "name": "John Doe",
    "phone": "1234567890",
    "campusLocation": "Building A, Room 101",
    "isVerified": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Update user profile
```http
PUT /api/users/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "9876543210",
  "campusLocation": "Building B, Room 202"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "...",
    "email": "student@university.edu",
    "name": "John Smith",
    "phone": "9876543210",
    "campusLocation": "Building B, Room 202",
    "isVerified": true
  }
}
```

### Health Check

```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "AuctionMe API is running"
}
```

## Authentication Flow

### Registration Flow
1. User submits registration with campus email
2. System validates email domain matches campus domain
3. User account is created with `isVerified: false`
4. Verification email is sent with a token
5. User clicks verification link in email
6. User's `isVerified` status is updated to `true`

### Login Flow
1. User submits email and password
2. System validates credentials
3. System checks if email is verified
4. If verified, system generates access token and refresh token
5. Tokens are returned to the user

### Protected Routes
- All routes that require authentication use the `authenticate` middleware
- Routes that require verified users use the `requireVerified` middleware
- For bidding and listing features, use `authenticateAndVerify` middleware

## Middleware

### authenticate
Verifies JWT access token and attaches user information to the request.

Usage:
```typescript
import { authenticate } from './middleware/auth.middleware';

router.get('/protected', authenticate, (req, res) => {
  // req.user is available here
});
```

### requireVerified
Checks if the authenticated user has verified their email.

Usage:
```typescript
import { authenticate, requireVerified } from './middleware/auth.middleware';

router.post('/listing', authenticate, requireVerified, (req, res) => {
  // Only verified users can access this
});
```

### authenticateAndVerify
Combined middleware for authentication and verification.

Usage:
```typescript
import { authenticateAndVerify } from './middleware/auth.middleware';

router.post('/bid', authenticateAndVerify, (req, res) => {
  // Only authenticated and verified users can bid
});
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Refresh token rotation
- ✅ Email verification requirement
- ✅ Campus email domain validation
- ✅ Secure password requirements (minimum 6 characters)
- ✅ Token expiration
- ✅ Protected routes with middleware

## Error Handling

All errors are returned in the following format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid credentials
- `403 Forbidden`: Insufficient permissions (e.g., email not verified)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── index.ts      # Main config
│   └── database.ts   # Database connection
├── controllers/      # Request handlers
│   ├── auth.controller.ts
│   └── user.controller.ts
├── middleware/       # Express middleware
│   └── auth.middleware.ts
├── models/          # Database models
│   └── User.model.ts
├── routes/          # API routes
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   └── index.ts
├── services/        # Business logic
│   ├── auth.service.ts
│   └── user.service.ts
├── types/           # TypeScript types
│   └── user.types.ts
├── utils/           # Utility functions
│   ├── email.utils.ts
│   ├── jwt.utils.ts
│   └── validation.utils.ts
├── app.ts           # Express app setup
└── index.ts         # Entry point

tests/               # Test files
├── auth.test.ts
└── user.test.ts
```

## Future Enhancements

- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Rate limiting
- [ ] Account lockout after failed attempts
- [ ] OAuth integration (Google, Facebook)
- [ ] Email templates with better design
- [ ] Admin role and permissions
- [ ] User activity logging

## License

ISC

## Author

AuctionMe Team
