# AuctionMe

> A campus auction platform with secure escrow-based payment handling

An app that allows people to put up items for auction on campus and deliver them to buyers. The money stays in escrow until the seller confirms delivery with the buyer's verification code.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Hughesneal88/AuctionMe.git
cd AuctionMe

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run tests
npm test

# Start the application
npm start
```

## ✨ Features

- **Auction Management**: Create, bid on, and manage campus auctions
- **Secure Bidding**: Place bids with validation and outbid notifications
- **Escrow Payments**: Funds held securely until delivery confirmation
- **Delivery Verification**: 6-digit codes for secure delivery confirmation
- **Automated Release**: Funds auto-release 24 hours after delivery confirmation
- **Refund Support**: Dispute resolution and refund processing
- **Mock Payment Gateway**: Safe testing without real transactions

## 🏗️ Architecture

### Core Components

- **Models**: Auction, Bid, Escrow, Payment
- **Services**: BiddingService, EscrowService, PaymentService
- **Mock Gateway**: Test-friendly payment processor

### Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js 5
- **Testing**: Jest 30
- **Linting**: ESLint 9
- **CI/CD**: GitHub Actions

## 🧪 Testing

The project includes comprehensive test coverage:

- **75 tests** total (all passing)
- **Unit tests**: 55 tests covering models and services
- **Integration tests**: 20 tests covering complete user flows
- **Coverage**: 70%+ (branches, functions, lines, statements)

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage report
npm run test:coverage
```

## 🔒 Security

- **Environment validation**: Required secrets enforced in production
- **Input validation**: All models validate inputs
- **Delivery codes**: Secure 6-digit verification codes
- **CodeQL scanning**: Automated security analysis
- **0 vulnerabilities**: Clean security audit

## 🔧 Configuration

Create a `.env` file based on `.env.example`:

```bash
NODE_ENV=development
PORT=3000
ENABLE_MOCK_PAYMENT=true
ESCROW_RELEASE_DELAY_HOURS=24
JWT_SECRET=your_secret_key
ENCRYPTION_KEY=your_encryption_key
```

See `.env.example` for all available options.

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Comprehensive deployment and testing guide
- **[SUMMARY.md](SUMMARY.md)**: Implementation summary and metrics

## 🔄 CI/CD Pipeline

Automated pipeline with GitHub Actions:

- ✅ Linting (ESLint)
- ✅ Unit & Integration Tests
- ✅ Coverage Validation
- ✅ Security Scanning (npm audit, CodeQL)
- ✅ Build Artifacts
- ✅ Deployment Readiness

Pipeline runs on push to `main`, `develop`, and `copilot/**` branches.

## 📖 How It Works

1. **Seller creates auction** with starting bid and end time
2. **Buyers place bids** on active auctions
3. **Auction ends** and winning bid is determined
4. **Escrow created** - winning bidder is charged
5. **Seller delivers item** and provides delivery code
6. **Buyer confirms** delivery with code
7. **Funds released** to seller after 24-hour delay
8. **Auction completed**

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run linter
npm run lint

# Run tests in watch mode
npm test -- --watch
```

## 🤝 Contributing

1. Create feature branch from `develop`
2. Write tests for new functionality
3. Ensure all tests pass locally
4. Push and create pull request
5. Wait for CI/CD pipeline to pass
6. Request code review

## 📝 License

ISC

## 🎯 Status

- ✅ Core functionality implemented
- ✅ Comprehensive test coverage
- ✅ CI/CD pipeline operational
- ✅ Security validated
- ✅ Production-ready

---

**Note**: The code is given on delivery or during pickup to verify successful transfer of goods.
