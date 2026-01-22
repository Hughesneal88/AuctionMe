# AuctionMe - Setup Guide

This guide will help you set up and run the AuctionMe Payment & Escrow system.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 16.x or higher ([Download](https://nodejs.org/))
- **npm** 8.x or higher (comes with Node.js)
- **PostgreSQL** 12.x or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Hughesneal88/AuctionMe.git
cd AuctionMe
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required Node.js packages including:
- Express (web framework)
- TypeScript (type-safe JavaScript)
- PostgreSQL client (database connection)
- Jest (testing framework)
- And other dependencies

### 3. Set Up PostgreSQL Database

#### Option A: Using psql CLI

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE auctionme;

# Exit psql
\q
```

#### Option B: Using pgAdmin

1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" > "Database"
4. Name it "auctionme"
5. Click "Save"

### 4. Run Database Migrations

Execute the schema SQL file to create all necessary tables:

```bash
psql -U postgres -d auctionme -f src/config/schema.sql
```

This will create:
- `users` table
- `auctions` table
- `transactions` table
- `escrow` table
- `payment_webhooks` table
- All necessary indexes

### 5. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual configuration:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=auctionme
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_password

# Server Configuration
PORT=3000
NODE_ENV=development

# Mobile Money Configuration (for production)
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_ENCRYPTION_KEY=your_flutterwave_encryption_key
FLUTTERWAVE_WEBHOOK_HASH=your_webhook_hash

# App Configuration
APP_BASE_URL=http://localhost:3000
```

**Note:** For development, the payment gateway uses mock implementations, so payment provider keys are optional.

### 6. Build the Application

Compile TypeScript to JavaScript:

```bash
npm run build
```

This creates a `dist/` directory with compiled JavaScript files.

### 7. Run Tests

Verify everything is working correctly:

```bash
npm test
```

Expected output:
```
Test Suites: 3 passed, 3 total
Tests:       29 passed, 29 total
```

### 8. Start the Server

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`.

Expected output:
```
╔═══════════════════════════════════════╗
║   AuctionMe Payment & Escrow API      ║
║   Server running on port 3000         ║
╚═══════════════════════════════════════╝
```

## Verification

### 1. Check Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T12:00:00.000Z",
  "service": "AuctionMe Payment & Escrow Service"
}
```

### 2. Test API Endpoints

You can use tools like:
- **Postman** - Import the API endpoints
- **curl** - Command-line testing
- **Insomnia** - REST client

Example transaction creation:

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "user_id": 1,
    "auction_id": 100,
    "amount": 50.00,
    "currency": "USD",
    "payment_method": "mobile_money",
    "payment_provider": "flutterwave"
  }'
```

## Common Issues & Solutions

### Issue: Cannot connect to database

**Solution:** 
1. Ensure PostgreSQL is running: `sudo service postgresql start` (Linux) or check Services (Windows)
2. Verify credentials in `.env` file
3. Check if database exists: `psql -U postgres -l | grep auctionme`

### Issue: Port 3000 already in use

**Solution:** 
Change the PORT in `.env` file to another port (e.g., 3001)

### Issue: TypeScript compilation errors

**Solution:** 
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Clear TypeScript cache: `rm -rf dist`
3. Rebuild: `npm run build`

### Issue: Tests failing

**Solution:** 
Ensure database is running (tests use mocked database, but environment must be valid)

## Project Structure

```
AuctionMe/
├── src/
│   ├── config/          # Database config and schema
│   ├── models/          # Data models (Transaction, Escrow, etc.)
│   ├── services/        # Business logic
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Rate limiting, etc.
│   ├── types/           # TypeScript definitions
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (after build)
├── node_modules/        # Dependencies
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment template
├── package.json         # Project metadata
├── tsconfig.json        # TypeScript configuration
└── jest.config.js       # Test configuration
```

## Next Steps

1. **Integrate with Frontend**: Connect your React/Vue frontend to the API
2. **Add Authentication**: Implement JWT or OAuth for user authentication
3. **Production Payment Gateway**: Replace mock with actual Flutterwave/M-Pesa implementation
4. **Deploy to Cloud**: Use platforms like Heroku, AWS, or DigitalOcean
5. **Set Up Monitoring**: Add logging and error tracking (e.g., Sentry)

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md) - Detailed API reference
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/Hughesneal88/AuctionMe/issues)
2. Review the API documentation
3. Open a new issue with detailed description

## License

ISC
