# Usage Examples

This document provides practical examples of how to use the AuctionMe authentication system.

## Table of Contents
1. [User Registration](#user-registration)
2. [Email Verification](#email-verification)
3. [User Login](#user-login)
4. [Accessing Protected Routes](#accessing-protected-routes)
5. [Profile Management](#profile-management)
6. [Token Refresh](#token-refresh)
7. [Logout](#logout)
8. [Implementing Protected Features](#implementing-protected-features)

## User Registration

### Request
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

### Response
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "student@university.edu",
    "name": "John Doe",
    "isVerified": false,
    "createdAt": "2024-01-22T10:00:00.000Z",
    "updatedAt": "2024-01-22T10:00:00.000Z"
  }
}
```

### JavaScript Example
```javascript
const registerUser = async (email, password, name) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Registration successful:', data.message);
      return data.user;
    } else {
      console.error('Registration failed:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usage
registerUser('student@university.edu', 'securepassword123', 'John Doe')
  .then(user => console.log('User created:', user))
  .catch(error => console.error('Failed:', error));
```

## Email Verification

After registration, users receive an email with a verification link. The link contains a token.

### Request
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### JavaScript Example
```javascript
const verifyEmail = async (token) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Email verified successfully!');
      return data.user;
    } else {
      console.error('Verification failed:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Extract token from URL (e.g., http://frontend.com/verify?token=...)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  verifyEmail(token)
    .then(user => console.log('Verified user:', user))
    .catch(error => console.error('Failed:', error));
}
```

## User Login

### Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securepassword123"
  }'
```

### Response
```json
{
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "student@university.edu",
    "name": "John Doe",
    "isVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### JavaScript Example with Token Storage
```javascript
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Login successful!');
      return data;
    } else {
      console.error('Login failed:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usage
loginUser('student@university.edu', 'securepassword123')
  .then(data => console.log('Logged in:', data.user))
  .catch(error => console.error('Failed:', error));
```

## Accessing Protected Routes

### Request with Authentication
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript Example with Auth Helper
```javascript
// Helper function to make authenticated requests
const authenticatedFetch = async (url, options = {}) => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('No access token found. Please login.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Handle token expiration
  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      return authenticatedFetch(url, options);
    } else {
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

// Get current user
const getCurrentUser = async () => {
  try {
    const response = await authenticatedFetch('http://localhost:3000/api/auth/me');
    const data = await response.json();
    
    if (response.ok) {
      return data.user;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usage
getCurrentUser()
  .then(user => console.log('Current user:', user))
  .catch(error => console.error('Failed:', error));
```

## Profile Management

### Get Profile
```javascript
const getProfile = async () => {
  const response = await authenticatedFetch('http://localhost:3000/api/users/profile');
  const data = await response.json();
  
  if (response.ok) {
    return data.user;
  } else {
    throw new Error(data.error);
  }
};
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "phone": "1234567890",
    "campusLocation": "Building A, Room 101"
  }'
```

### JavaScript Example
```javascript
const updateProfile = async (profileData) => {
  try {
    const response = await authenticatedFetch(
      'http://localhost:3000/api/users/profile',
      {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log('Profile updated successfully!');
      return data.user;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usage
updateProfile({
  name: 'John Smith',
  phone: '1234567890',
  campusLocation: 'Building A, Room 101'
})
  .then(user => console.log('Updated user:', user))
  .catch(error => console.error('Failed:', error));
```

## Token Refresh

### Request
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### JavaScript Example
```javascript
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return false;
    }

    const response = await fetch('http://localhost:3000/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    
    if (response.ok) {
      // Update access token
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } else {
      // Refresh token invalid, clear storage
      localStorage.clear();
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};
```

## Logout

### Request
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### JavaScript Example
```javascript
const logoutUser = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await authenticatedFetch(
      'http://localhost:3000/api/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      // Clear local storage
      localStorage.clear();
      console.log('Logged out successfully!');
      
      // Redirect to login page
      window.location.href = '/login';
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    // Clear storage anyway
    localStorage.clear();
    window.location.href = '/login';
  }
};

// Usage
logoutUser();
```

## Implementing Protected Features

### Example: Create a Listing (Only Verified Users)
```javascript
const createListing = async (listingData) => {
  try {
    const response = await authenticatedFetch(
      'http://localhost:3000/api/marketplace/listings',
      {
        method: 'POST',
        body: JSON.stringify(listingData),
      }
    );

    const data = await response.json();
    
    if (response.status === 403) {
      // User not verified
      alert('Please verify your email before creating listings.');
      return null;
    }
    
    if (response.ok) {
      console.log('Listing created successfully!');
      return data.listing;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usage
createListing({
  title: 'Used Textbook',
  description: 'Biology 101 textbook in good condition',
  startingPrice: 20,
  endDate: '2024-02-01T00:00:00.000Z'
})
  .then(listing => console.log('Created listing:', listing))
  .catch(error => console.error('Failed:', error));
```

### Example: Place a Bid (Only Verified Users)
```javascript
const placeBid = async (listingId, bidAmount) => {
  try {
    const response = await authenticatedFetch(
      `http://localhost:3000/api/marketplace/listings/${listingId}/bids`,
      {
        method: 'POST',
        body: JSON.stringify({ bidAmount }),
      }
    );

    const data = await response.json();
    
    if (response.status === 403) {
      // User not verified
      alert('Please verify your email before placing bids.');
      return null;
    }
    
    if (response.ok) {
      console.log('Bid placed successfully!');
      return data.bid;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usage
placeBid('listing-id-123', 25)
  .then(bid => console.log('Placed bid:', bid))
  .catch(error => console.error('Failed:', error));
```

## Complete React Component Example

```javascript
import React, { useState, useEffect } from 'react';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser(data.user);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const updateUserProfile = async (profileData) => {
    const updatedUser = await updateProfile(profileData);
    setUser(updatedUser);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
```

## Error Handling

### Common Error Responses

```javascript
// Handle different error scenarios
const handleApiError = (response, data) => {
  switch (response.status) {
    case 400:
      alert(`Invalid request: ${data.error}`);
      break;
    case 401:
      alert('Authentication required. Please login.');
      window.location.href = '/login';
      break;
    case 403:
      alert(`Access denied: ${data.error}`);
      if (data.error.includes('verification')) {
        window.location.href = '/verify-email';
      }
      break;
    case 404:
      alert('Resource not found');
      break;
    case 500:
      alert('Server error. Please try again later.');
      break;
    default:
      alert(`Error: ${data.error || 'Unknown error'}`);
  }
};
```

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (consider httpOnly cookies)
3. **Implement automatic token refresh**
4. **Handle token expiration gracefully**
5. **Clear tokens on logout**
6. **Validate user input on client side**
7. **Handle errors appropriately**
8. **Don't store sensitive data in localStorage**
9. **Implement proper loading states**
10. **Test authentication flows thoroughly**
