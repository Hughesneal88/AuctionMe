# API Documentation - Disputes, Admin Panel & Escrow Resolution

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Dispute APIs](#dispute-apis)
4. [Admin APIs](#admin-apis)
5. [Error Handling](#error-handling)

## Overview

This API provides comprehensive dispute management, admin panel functionality, and escrow resolution features for the AuctionMe platform.

### Base URL
```
http://localhost:3000/api
```

### Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Dispute APIs

### Create Dispute
Create a new dispute for an auction.

**Endpoint:** `POST /disputes`

**Authorization:** Authenticated Buyer

**Request Body:**
```json
{
  "auctionId": "507f1f77bcf86cd799439011",
  "reason": "item_not_received",
  "description": "The item was not delivered after 5 days",
  "evidence": [
    {
      "description": "Screenshot of tracking info",
      "imageUrls": ["https://example.com/image.jpg"]
    }
  ]
}
```

**Valid Reasons:**
- `item_not_received`
- `item_not_as_described`
- `damaged_item`
- `wrong_item`
- `other`

**Response:** `201 Created`
```json
{
  "message": "Dispute created successfully",
  "dispute": {
    "_id": "507f1f77bcf86cd799439012",
    "auctionId": "507f1f77bcf86cd799439011",
    "buyerId": "507f1f77bcf86cd799439013",
    "sellerId": "507f1f77bcf86cd799439014",
    "reason": "item_not_received",
    "description": "The item was not delivered after 5 days",
    "status": "open",
    "timeLimit": "2026-01-29T11:58:47.566Z",
    "createdAt": "2026-01-22T11:58:47.566Z"
  }
}
```

### Get User's Disputes
Get all disputes created by the authenticated user.

**Endpoint:** `GET /disputes`

**Authorization:** Authenticated User

**Query Parameters:**
- `status` (optional): Filter by status (open, under_review, resolved, rejected)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "disputes": [...],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Get Dispute by ID
Get details of a specific dispute.

**Endpoint:** `GET /disputes/:id`

**Authorization:** Authenticated User (must be buyer or seller)

**Response:** `200 OK`
```json
{
  "dispute": {
    "_id": "507f1f77bcf86cd799439012",
    "auctionId": {...},
    "buyerId": {...},
    "sellerId": {...},
    "escrowId": {...},
    "reason": "item_not_received",
    "description": "The item was not delivered",
    "evidence": [...],
    "status": "open",
    "createdAt": "2026-01-22T11:58:47.566Z"
  }
}
```

### Add Evidence to Dispute
Add additional evidence to an existing dispute.

**Endpoint:** `POST /disputes/:id/evidence`

**Authorization:** Authenticated Buyer (dispute creator)

**Request Body:**
```json
{
  "description": "Additional photo evidence",
  "imageUrls": ["https://example.com/evidence.jpg"]
}
```

**Response:** `200 OK`
```json
{
  "message": "Evidence added successfully",
  "dispute": {...}
}
```

## Admin APIs

All admin endpoints require admin role.

### Get All Disputes (Admin)
Get all disputes in the system.

**Endpoint:** `GET /admin/disputes`

**Authorization:** Admin

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`
```json
{
  "disputes": [...],
  "pagination": {...}
}
```

### Get Dispute by ID (Admin)
Get full details of any dispute.

**Endpoint:** `GET /admin/disputes/:id`

**Authorization:** Admin

**Response:** `200 OK`

### Mark Dispute Under Review
Mark a dispute as being under admin review.

**Endpoint:** `PUT /admin/disputes/:id/review`

**Authorization:** Admin

**Response:** `200 OK`
```json
{
  "message": "Dispute marked as under review",
  "dispute": {...}
}
```

### Resolve Dispute
Resolve a dispute and handle escrow accordingly.

**Endpoint:** `POST /admin/disputes/:id/resolve`

**Authorization:** Admin

**Request Body:**
```json
{
  "resolution": "refund_buyer",
  "resolutionNote": "Item was confirmed not delivered, refunding buyer"
}
```

**Valid Resolutions:**
- `refund_buyer` - Refund escrow to buyer
- `release_to_seller` - Release escrow to seller
- `partial_refund` - Partial refund (manual handling required)
- `none` - No escrow action

**Response:** `200 OK`
```json
{
  "message": "Dispute resolved successfully",
  "dispute": {...}
}
```

### Release Escrow
Manually release escrow to seller.

**Endpoint:** `POST /admin/escrow/:id/release`

**Authorization:** Admin

**Request Body:**
```json
{
  "note": "Releasing escrow after verification"
}
```

**Response:** `200 OK`
```json
{
  "message": "Escrow released successfully",
  "escrow": {...}
}
```

### Refund Escrow
Manually refund escrow to buyer.

**Endpoint:** `POST /admin/escrow/:id/refund`

**Authorization:** Admin

**Request Body:**
```json
{
  "note": "Refunding due to seller fraud"
}
```

**Response:** `200 OK`
```json
{
  "message": "Escrow refunded successfully",
  "escrow": {...}
}
```

### Suspend User
Temporarily suspend a user.

**Endpoint:** `POST /admin/users/:id/suspend`

**Authorization:** Admin

**Request Body:**
```json
{
  "durationDays": 7,
  "reason": "Violation of community guidelines"
}
```

**Response:** `200 OK`
```json
{
  "message": "User suspended successfully",
  "user": {
    "id": "507f1f77bcf86cd799439013",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "suspended",
    "suspendedUntil": "2026-01-29T11:58:47.566Z",
    "suspensionReason": "Violation of community guidelines"
  }
}
```

### Unsuspend User
Remove suspension from a user.

**Endpoint:** `POST /admin/users/:id/unsuspend`

**Authorization:** Admin

**Response:** `200 OK`
```json
{
  "message": "User unsuspended successfully",
  "user": {...}
}
```

### Ban User
Permanently ban a user.

**Endpoint:** `POST /admin/users/:id/ban`

**Authorization:** Admin

**Request Body:**
```json
{
  "reason": "Repeated violations and fraudulent activity"
}
```

**Response:** `200 OK`
```json
{
  "message": "User banned successfully",
  "user": {...}
}
```

### Get Audit Logs
Get audit logs with filtering.

**Endpoint:** `GET /admin/audit-logs`

**Authorization:** Admin

**Query Parameters:**
- `action` (optional): Filter by action type
- `performedBy` (optional): Filter by user ID
- `targetUser` (optional): Filter by target user ID
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "action": "dispute_created",
      "performedBy": {...},
      "targetResource": {
        "type": "Dispute",
        "id": "507f1f77bcf86cd799439012"
      },
      "details": {...},
      "createdAt": "2026-01-22T11:58:47.566Z"
    }
  ],
  "pagination": {...}
}
```

### Get Resource Audit Logs
Get all audit logs for a specific resource.

**Endpoint:** `GET /admin/audit-logs/resource/:type/:id`

**Authorization:** Admin

**Parameters:**
- `type`: Resource type (Dispute, Escrow, Auction, User)
- `id`: Resource ID

**Response:** `200 OK`
```json
{
  "logs": [...]
}
```

## Error Handling

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Validation Errors
When validation fails, you'll receive a 400 status with details:
```json
{
  "error": "Missing required fields: auctionId, reason, description"
}
```

## Security Features

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **Role-Based Access Control**: Admin endpoints restricted to admin users
3. **Audit Logging**: All actions are logged with user, timestamp, and details
4. **Escrow Locking**: Escrow automatically locked during disputes
5. **User Suspension**: Suspended users cannot perform actions
6. **Time Limits**: Disputes have configurable time limits

## Configuration

Set these environment variables:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/auctionme
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
DISPUTE_TIME_LIMIT_DAYS=7
ESCROW_RELEASE_DELAY_HOURS=24
```
