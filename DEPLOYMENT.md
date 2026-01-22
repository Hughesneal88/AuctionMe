# AuctionMe - Testing, Deployment & CI/CD Documentation

## Overview

AuctionMe is a campus auction platform that allows users to auction items with secure escrow-based payment handling. This document covers the testing infrastructure, deployment setup, and CI/CD pipeline.

## Architecture

### Core Components

1. **Models**: Data structures for Auction, Bid, Escrow, and Payment
2. **Services**: Business logic for Bidding, Escrow, and Payment processing
3. **Mock Payment Gateway**: Test-friendly payment processor

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Testing**: Jest
- **Linting**: ESLint
- **CI/CD**: GitHub Actions

## Testing

### Test Structure

```
tests/
├── unit/           # Unit tests for individual components
│   ├── bidding.test.js
│   ├── escrow.test.js
│   └── payment.test.js
└── integration/    # Integration tests for complete flows
    ├── bidding-flow.test.js
    └── payment-flow.test.js
```

### Running Tests

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

### Coverage Thresholds

The project maintains minimum coverage thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Test Features

#### Unit Tests

- **Escrow Logic**: 15 test cases covering:
  - Escrow creation and charging
  - Delivery verification with codes
  - Fund release after delay period
  - Refund processing
  - Dispute handling
  - Auto-release functionality

- **Bidding Logic**: 19 test cases covering:
  - Auction creation and management
  - Bid placement and validation
  - Winning bid determination
  - Auction lifecycle (active → ended → completed)
  - Cancellation handling

- **Payment Processing**: 21 test cases covering:
  - Charge processing
  - Refund handling
  - Payout processing
  - Mock gateway functionality
  - Error scenarios

#### Integration Tests

- **Complete auction flow**: From creation through bidding to delivery
- **Payment lifecycle**: Charge → hold → payout flows
- **Multi-user scenarios**: Concurrent auctions and bids
- **Error handling**: Payment failures, invalid codes, premature releases

### Mock Payment Gateway

The `MockPaymentGateway` simulates a real payment processor:

```javascript
const gateway = new MockPaymentGateway();

// Configure failure rate for testing (0-1)
gateway.setFailureRate(0.1); // 10% failure rate

// Process payments
await gateway.charge(userId, amount, metadata);
await gateway.refund(transactionId, amount);
await gateway.payout(userId, amount, metadata);
```

Features:
- Simulated network delays (50-150ms)
- Configurable failure rates
- Transaction tracking
- Supports charge, refund, and payout operations

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Application
NODE_ENV=development
PORT=3000
APP_NAME=AuctionMe

# Database (configure as needed)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auctionme
DB_USER=your_user
DB_PASSWORD=your_password

# Payment Gateway
PAYMENT_GATEWAY_API_KEY=your_key
PAYMENT_GATEWAY_SECRET=your_secret
ENABLE_MOCK_PAYMENT=true  # Use mock in dev/test

# Escrow Settings
ESCROW_RELEASE_DELAY_HOURS=24
ESCROW_REFUND_WINDOW_DAYS=7

# Security
JWT_SECRET=your_secret_change_in_production
ENCRYPTION_KEY=your_key_change_in_production
```

### Configuration Validation

The config module validates required secrets in production:

```javascript
const config = require('./src/config');

// Throws error if required secrets missing in production
// Validates that default secrets aren't used in production
```

## CI/CD Pipeline

### GitHub Actions Workflow

The pipeline runs on:
- Push to `main`, `develop`, or `copilot/**` branches
- Pull requests to `main` or `develop`

### Pipeline Stages

#### 1. Lint
- Code style checking with ESLint
- Runs: Always

#### 2. Unit Tests
- Runs unit tests
- Uploads coverage reports
- Runs: On all commits

#### 3. Integration Tests
- Runs integration tests
- Validates complete flows
- Runs: On all commits

#### 4. Test Coverage
- Validates coverage thresholds
- Uploads full coverage report
- Requires: Unit and integration tests pass

#### 5. Security Scan
- npm audit for vulnerabilities
- Dependency version checking
- Runs: Parallel with tests

#### 6. CodeQL Analysis
- Static code analysis
- Security vulnerability detection
- Runs: On all commits

#### 7. Build
- Validates configuration
- Creates deployment artifact
- Requires: Lint and tests pass

#### 8. Deployment Readiness
- Final validation
- Only on `main` branch
- Requires: All previous stages pass

### Viewing CI/CD Results

1. Navigate to the Actions tab in GitHub
2. Select the workflow run
3. View logs for each job
4. Download artifacts (coverage reports, build artifacts)

## Security

### Secrets Management

- Never commit secrets to the repository
- Use environment variables for all sensitive data
- `.env` is gitignored
- `.env.example` provides template

### Production Requirements

In production, these environment variables are mandatory:
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `PAYMENT_GATEWAY_API_KEY`
- `PAYMENT_GATEWAY_SECRET`

### Security Scanning

The CI/CD pipeline includes:
- **npm audit**: Checks for vulnerable dependencies
- **CodeQL**: Static analysis for security issues
- Runs on every commit

## Deployment

### Prerequisites

1. Node.js 20+ installed
2. Environment variables configured
3. Database setup (if using real database)
4. Payment gateway credentials (for production)

### Manual Deployment

```bash
# 1. Clone repository
git clone <repository-url>
cd AuctionMe

# 2. Install dependencies
npm ci

# 3. Configure environment
cp .env.example .env
# Edit .env with production values

# 4. Run tests
npm test

# 5. Start application
npm start
```

### Using Build Artifact

Download the build artifact from GitHub Actions:

```bash
# Extract artifact
tar -xzf auctionme-build.tar.gz

# Navigate to build
cd build

# Start application
NODE_ENV=production node src/index.js
```

### Health Check

The application exposes a health endpoint:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "app": "AuctionMe",
  "environment": "production",
  "timestamp": "2026-01-22T12:00:00.000Z"
}
```

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests in watch mode
npm test -- --watch
```

### Adding New Tests

1. Create test file in `tests/unit/` or `tests/integration/`
2. Follow naming convention: `*.test.js`
3. Use Jest testing framework
4. Ensure tests are isolated and repeatable

Example:
```javascript
const Service = require('../../src/services/Service');

describe('ServiceName', () => {
  let service;

  beforeEach(() => {
    service = new Service();
  });

  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = service.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Troubleshooting

### Tests Failing

```bash
# Clear jest cache
npx jest --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test tests/unit/escrow.test.js
```

### CI/CD Issues

1. Check GitHub Actions logs
2. Verify environment variables in GitHub Secrets
3. Ensure all dependencies are in package.json
4. Check Node.js version compatibility

### Configuration Errors

```bash
# Validate configuration
node -e "require('./src/config'); console.log('Config OK');"

# Check for missing environment variables
node -e "const config = require('./src/config'); console.log(config);"
```

## Future Enhancements

- [ ] Add database integration tests
- [ ] Implement E2E tests with real payment gateway (sandbox)
- [ ] Add performance testing
- [ ] Implement automated deployment to cloud platform
- [ ] Add monitoring and logging integration
- [ ] Container-based deployment with Docker
- [ ] Kubernetes deployment configuration

## Contributing

1. Create feature branch from `develop`
2. Write tests for new functionality
3. Ensure all tests pass locally
4. Push and create pull request
5. Wait for CI/CD pipeline to pass
6. Request code review

## License

ISC
