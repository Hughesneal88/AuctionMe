# AuctionMe - Notifications, Security & Fraud Prevention

An app that allows people to put up stuff for auction on campus and deliver the items to the user. The money stays in escrow until the seller confirms delivery with the buyer's code. The code is given on delivery or during pickup.

## Features Implemented

### ✅ In-app Notification System
- Real-time notifications for bid activities, deliveries, and security alerts
- Notification types: bid placed, bid won, outbid, delivery codes, security alerts
- Mark as read/unread functionality
- Notification history and management

### ✅ Email Notifications (Optional)
- Configurable email service using nodemailer
- Email templates for bids, delivery codes, and security alerts
- Works with any SMTP provider (Gmail, SendGrid, etc.)

### ✅ Rate Limiting
- Per-action rate limiting (bids, payments, delivery code verification)
- Configurable time windows and limits
- Automatic warning notifications when approaching limits
- Protection against API abuse

### ✅ Delivery Code Brute-Force Protection
- 6-digit numeric delivery codes
- Automatic locking after 5 failed attempts
- Expiration time (default 72 hours)
- Audit logging of all verification attempts
- One-time use enforcement

### ✅ Fake Bid & Spam Prevention
- Risk scoring system for bids
- Bid velocity tracking
- Pattern anomaly detection
- Spam content detection (keywords, excessive caps, special characters)
- Automatic blocking of high-risk activities

### ✅ Full Audit Logging
- Comprehensive logging of all actions
- Severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- Tracked data: user, action, resource, IP address, user agent
- Queryable by user, action, resource, or severity
- High-severity alert monitoring

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Email**: Nodemailer (optional)
- **Testing**: Jest
- **Linting**: ESLint

## Project Structure

```
src/
├── controllers/        # Request handlers
│   ├── NotificationController.ts
│   ├── AuditController.ts
│   └── DeliveryCodeController.ts
├── services/          # Business logic
│   ├── NotificationService.ts
│   ├── AuditService.ts
│   ├── EmailService.ts
│   ├── FraudDetectionService.ts
│   └── DeliveryCodeService.ts
├── models/            # Data models
│   ├── NotificationModel.ts
│   ├── AuditLogModel.ts
│   ├── RateLimitModel.ts
│   └── DeliveryCodeModel.ts
├── middleware/        # Express middleware
│   ├── rateLimiter.ts
│   └── security.ts
├── routes/            # API routes
│   ├── notificationRoutes.ts
│   ├── auditRoutes.ts
│   └── deliveryCodeRoutes.ts
├── types/             # TypeScript types
│   └── index.ts
└── index.ts           # Application entry point
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3000
NODE_ENV=development

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@auctionme.com
```

## Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

## API Endpoints

### Notifications

- `GET /api/notifications` - Get all notifications (rate limited)
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/test` - Create test notification

### Audit Logs

- `GET /api/audit/user` - Get user's audit logs
- `GET /api/audit/recent` - Get recent logs (admin)
- `GET /api/audit/high-severity` - Get high-severity logs (admin)
- `GET /api/audit/action/:action` - Get logs by action
- `GET /api/audit/resource/:resource/:id` - Get logs for resource

### Delivery Codes

- `POST /api/delivery-codes` - Generate delivery code
- `POST /api/delivery-codes/:id/verify` - Verify code (rate limited)
- `GET /api/delivery-codes/auction/:auctionId` - Get code by auction
- `GET /api/delivery-codes/:id/valid` - Check if valid

## Security Features

### Rate Limiting
```typescript
// Predefined rate limiters
RateLimiter.bidding       // 10 bids per minute
RateLimiter.payment       // 5 payments per minute
RateLimiter.deliveryCodeVerification  // 5 attempts per minute
RateLimiter.notification  // 30 requests per minute
```

### Fraud Detection
- Bid validation with risk scoring
- High-velocity bid detection (>5 bids/minute)
- Pattern anomaly detection (rapid-fire, round numbers)
- Spam content filtering
- Automatic suspicious activity logging

### Delivery Code Protection
- Brute-force protection (5 attempts then lock)
- Time-based expiration
- One-time use enforcement
- Full audit trail of attempts

## Usage Examples

### Creating a Notification
```typescript
import { notificationService } from './services/NotificationService';
import { NotificationType } from './types';

await notificationService.createNotification(
  userId,
  NotificationType.BID_PLACED,
  'New Bid',
  'Someone bid $100 on your item',
  { auctionId, amount: 100 }
);
```

### Validating a Bid
```typescript
import { fraudDetectionService } from './services/FraudDetectionService';

const validation = await fraudDetectionService.validateBid(
  userId,
  auctionId,
  bidAmount,
  currentHighestBid
);

if (!validation.isValid) {
  console.log('Bid rejected:', validation.reason);
}
```

### Generating & Verifying Delivery Code
```typescript
import { deliveryCodeService } from './services/DeliveryCodeService';

// Generate code (after auction ends)
const code = await deliveryCodeService.generateCode(
  auctionId,
  buyerId,
  sellerId,
  72 // expires in 72 hours
);

// Verify code (at delivery)
const result = await deliveryCodeService.verifyCode(
  code.id,
  userEnteredCode,
  sellerId
);

if (result.success) {
  // Release payment from escrow
}
```

### Audit Logging
```typescript
import { auditService } from './services/AuditService';

await auditService.logBidPlaced(
  auctionId,
  userId,
  amount,
  ipAddress,
  userAgent
);

// Get high-severity incidents
const incidents = await auditService.getHighSeverityLogs();
```

## Testing

The project includes comprehensive unit tests for all services:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test NotificationService.test.ts
```

Test coverage includes:
- Notification creation and management
- Fraud detection and validation
- Delivery code generation and verification
- Rate limiting functionality
- Spam detection

## Production Considerations

### Current Implementation (In-Memory)
- Suitable for development and testing
- Data is lost on server restart
- Not suitable for multiple server instances

### Production Recommendations

1. **Database Integration**
   - Replace in-memory stores with PostgreSQL/MongoDB
   - Add proper indexing for performance
   - Implement connection pooling

2. **Caching Layer**
   - Use Redis for rate limiting
   - Cache frequently accessed notifications
   - Implement pub/sub for real-time updates

3. **Authentication**
   - Implement JWT-based authentication
   - Add role-based access control (RBAC)
   - Integrate with OAuth providers

4. **Message Queue**
   - Use RabbitMQ/SQS for notification delivery
   - Ensure reliable email sending
   - Handle retry logic

5. **Monitoring**
   - Add application performance monitoring (APM)
   - Set up alerts for high-severity audit logs
   - Monitor rate limit violations

6. **Scalability**
   - Deploy behind load balancer
   - Use horizontal scaling for API servers
   - Implement database read replicas

## Security Best Practices

✅ **Implemented:**
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Brute-force protection
- Comprehensive audit logging
- Spam and fraud detection

🔒 **Additional Recommendations:**
- Enable HTTPS in production
- Implement CORS policies
- Add request signing
- Use environment variables for secrets
- Regular security audits
- Dependency vulnerability scanning

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run linter and tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
