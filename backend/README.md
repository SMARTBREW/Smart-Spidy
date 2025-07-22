# Smart-Spidy Backend

This is the backend API for Smart-Spidy, built with Express.js and Supabase.

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Environment
NODE_ENV=development
PORT=3000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
REFRESH_JWT_SECRET=your_refresh_jwt_secret_key_here
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_email_password
EMAIL_FROM=noreply@yourapp.com
```

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file with the required environment variables.

4. Make sure your Supabase database has the required tables (as provided in your SQL schema).

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user (requires authentication)
- `POST /api/users/refresh-token` - Refresh access token

### User Profile (Protected)
- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/change-password` - Change user password

### User Management (Admin Only)
- `GET /api/users` - Get all users (with pagination and filters)
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Update user status

### User Sessions (Admin Only)
- `GET /api/users/sessions` - Get all user sessions (with pagination and filters)
- `GET /api/users/sessions/stats` - Get session statistics

### Health Check
- `GET /health` - API health check

## Database Schema

The application expects the following Supabase tables to exist:
- `users` - User accounts with authentication
- `chats` - Chat conversations
- `messages` - Chat messages
- `instagram_accounts` - Instagram account data
- `user_sessions` - User session tracking
- `fundraisers` - Fundraiser data
- `notifications` - User notifications

Refer to the SQL schema provided for the complete table structure.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Rate Limiting

The API implements rate limiting (100 requests per 15 minutes per IP) to prevent abuse. 