# Security Implementation Guide

## Overview
This document outlines the security measures implemented in the AuctionMe authentication system and best practices for maintaining security.

## Security Features Implemented

### 1. Password Security
- **Hashing**: All passwords are hashed using bcryptjs with a salt factor of 10 before storage
- **Minimum Length**: Passwords must be at least 6 characters
- **Never Stored Plain**: Passwords are never stored in plain text
- **Excluded from Queries**: Password field has `select: false` in schema to prevent accidental exposure

### 2. Campus Email Validation
- **Domain Checking**: Registration validates that email ends with configured campus domain
- **Purpose**: Ensures only campus users can register
- **Configuration**: Domain can be changed via `CAMPUS_EMAIL_DOMAIN` environment variable

### 3. Email Verification
- **Verification Required**: Users must verify email before accessing protected features
- **Token-Based**: Verification uses JWT tokens with 24-hour expiration
- **Blocking**: Unverified users are blocked from bidding and listing
- **Resend Option**: Users can request a new verification email if needed

### 4. JWT Authentication
- **Access Tokens**: Short-lived tokens (default: 7 days) for API access
- **Refresh Tokens**: Long-lived tokens (default: 30 days) for token renewal
- **Secure Storage**: Tokens stored securely on client side (localStorage or httpOnly cookies recommended)
- **Token Verification**: All protected routes verify token validity

### 5. Authorization Middleware
- **authenticate**: Verifies JWT and attaches user info to request
- **requireVerified**: Ensures user has verified their email
- **authenticateAndVerify**: Combined middleware for full protection

### 6. Sensitive Data Protection
- **Field Exclusion**: Sensitive fields (tokens, refresh tokens) have `select: false`
- **Sanitization**: `sanitizeUser()` utility removes sensitive data before sending responses
- **Never Exposed**: Verification tokens, password hashes never sent to clients

### 7. Token Management
- **Refresh Token Rotation**: New access tokens generated via refresh tokens
- **Token Invalidation**: Logout removes refresh token from database
- **Multiple Sessions**: Users can have multiple active sessions (refresh tokens)

## Security Best Practices

### Environment Variables
**Critical**: Never commit sensitive values to version control

```env
# Use strong, random secrets in production
JWT_SECRET=use-openssl-rand-base64-32-to-generate
JWT_REFRESH_SECRET=use-different-secret-for-refresh

# Use strong email credentials
EMAIL_PASSWORD=app-specific-password

# Use production MongoDB URI with authentication
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/auctionme
```

Generate secrets:
```bash
# Generate strong JWT secrets
openssl rand -base64 32
```

### HTTPS in Production
Always use HTTPS in production to prevent token interception:
```typescript
// In production, ensure secure connection
app.use((req, res, next) => {
  if (config.nodeEnv === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### Rate Limiting
Implement rate limiting to prevent brute force attacks:
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
});

router.post('/login', authLimiter, authController.login);
```

### Helmet for Security Headers
Add security headers with Helmet:
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Input Validation
Always validate and sanitize user inputs:
```typescript
import { body, validationResult } from 'express-validator';

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim().escape(),
  body('name').notEmpty().trim().escape(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process registration
});
```

### CORS Configuration
Configure CORS properly for production:
```typescript
import cors from 'cors';

const corsOptions = {
  origin: config.urls.frontend, // Only allow frontend domain
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

### Token Storage on Client Side
**Recommendations:**
1. **Best**: httpOnly cookies (prevents XSS attacks)
2. **Good**: localStorage (convenient but vulnerable to XSS)
3. **Avoid**: sessionStorage for long-term storage

Example with httpOnly cookies:
```typescript
// Server-side: Set token in httpOnly cookie
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

### Database Security
- **Use Authentication**: Always use MongoDB with authentication enabled
- **Principle of Least Privilege**: Database user should only have necessary permissions
- **Network Security**: Restrict database access to specific IP addresses
- **Regular Backups**: Implement automated database backups

### Monitoring and Logging
Implement logging for security events:
```typescript
// Log authentication attempts
console.log(`Login attempt: ${email} from ${req.ip}`);

// Log failed attempts
console.warn(`Failed login: ${email} from ${req.ip}`);

// Use proper logging library in production
import winston from 'winston';
```

## Vulnerability Prevention

### 1. SQL/NoSQL Injection
- **Mongoose Protection**: Mongoose provides built-in protection
- **Input Validation**: Always validate and sanitize inputs
- **Parameterized Queries**: Use Mongoose methods (findOne, findById, etc.)

### 2. Cross-Site Scripting (XSS)
- **Input Sanitization**: Sanitize all user inputs
- **Output Encoding**: Encode data before rendering
- **CSP Headers**: Use Content Security Policy headers

### 3. Cross-Site Request Forgery (CSRF)
- **CSRF Tokens**: Implement CSRF tokens for state-changing operations
- **SameSite Cookies**: Use SameSite attribute on cookies
- **Origin Checking**: Validate Origin/Referer headers

### 4. Brute Force Attacks
- **Rate Limiting**: Limit authentication attempts
- **Account Lockout**: Lock account after N failed attempts
- **CAPTCHA**: Add CAPTCHA after multiple failures

### 5. Session Hijacking
- **Secure Tokens**: Use cryptographically secure tokens
- **Token Expiration**: Implement short-lived access tokens
- **IP Validation**: Optionally validate IP address consistency

## Security Checklist for Production

- [ ] Change all default secrets in `.env`
- [ ] Use strong, unique JWT secrets (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Implement Helmet security headers
- [ ] Use httpOnly cookies for tokens
- [ ] Enable MongoDB authentication
- [ ] Restrict MongoDB network access
- [ ] Set up logging and monitoring
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Implement backup strategy
- [ ] Add CSRF protection
- [ ] Configure proper error messages (don't leak info)
- [ ] Review and test all endpoints

## Incident Response

### If a Security Breach Occurs:
1. **Immediate Actions**:
   - Revoke all active tokens
   - Force password reset for affected users
   - Investigate the breach source
   - Document everything

2. **Communication**:
   - Notify affected users
   - Provide clear instructions
   - Be transparent about the issue

3. **Prevention**:
   - Fix the vulnerability
   - Review similar code
   - Update security measures
   - Conduct security audit

## Regular Maintenance

### Weekly:
- Review authentication logs
- Check for suspicious activity
- Monitor failed login attempts

### Monthly:
- Update dependencies (`npm audit fix`)
- Review and rotate secrets if needed
- Check security advisories

### Quarterly:
- Full security audit
- Penetration testing
- Review access controls
- Update security documentation

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Contact

For security concerns or to report vulnerabilities, please contact: [security@auctionme.com]
