# Admin API Documentation

This document describes the admin API endpoints for user management in the Smart-Spidy application.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All admin endpoints require authentication with a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get User Statistics
**GET** `/users/stats`

Returns overall user statistics for the admin dashboard.

**Response:**
```json
{
  "overall": {
    "total": 25,
    "active": 20,
    "inactive": 5,
    "admins": 3,
    "users": 22
  }
}
```

### 2. Get All Users
**GET** `/users`

Returns a paginated list of all users with optional filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of users per page (default: 10, max: 100)
- `name` (optional): Filter by name (case-insensitive search)
- `role` (optional): Filter by role ('user' or 'admin')

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 3. Get User by ID
**GET** `/users/:id`

Returns a specific user by their ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 4. Create User
**POST** `/users`

Creates a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "user",
  "is_active": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 5. Update User
**PATCH** `/users/:id`

Updates an existing user.

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "role": "admin",
  "is_active": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "role": "admin",
  "is_active": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 6. Delete User
**DELETE** `/users/:id`

Deletes a user permanently.

**Response:** 204 No Content

### 7. Update User Status
**PATCH** `/users/:id/status`

Activates or deactivates a user.

**Request Body:**
```json
{
  "is_active": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't have admin privileges
- `404 Not Found`: User not found
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

## Frontend Integration

The frontend uses the `adminApi` service from `src/services/admin.ts` to interact with these endpoints. The service handles:

- Authentication headers
- Request/response formatting
- Error handling
- Type safety with TypeScript interfaces

## Security Notes

1. All endpoints require admin role authentication
2. Passwords are hashed using bcrypt before storage
3. Email addresses are validated and must be unique
4. User IDs are validated using UUID format
5. Rate limiting is applied to prevent abuse

## Testing

Use the provided `test-admin-api.js` script to test the endpoints:

```bash
node test-admin-api.js
```

Remember to replace `YOUR_TEST_TOKEN_HERE` with a valid admin JWT token. 