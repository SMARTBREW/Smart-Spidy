# API Troubleshooting Guide

## Issue: 204 No Content Response for OPTIONS Request

The 204 No Content response for OPTIONS requests is **normal behavior** for CORS preflight requests. This is not an error.

### What's Happening

1. **CORS Preflight (OPTIONS)**: Browser sends OPTIONS request to check if the actual request is allowed
2. **Server Response**: Server responds with 204 No Content and CORS headers
3. **Actual Request**: If preflight succeeds, browser sends the actual GET request

### Debugging Steps

#### 1. Check Backend Server Status

```bash
cd backend
npm start
```

Check if the server starts without errors.

#### 2. Test API Endpoints

Run the debugging script:

```bash
cd backend
node debug-api.js
```

This will test:
- Health check endpoint
- CORS preflight requests
- Unauthenticated requests
- Invalid token requests

#### 3. Check Authentication Flow

The `/api/users` endpoint requires:
- Valid JWT token in Authorization header
- User must have 'admin' role
- Token must not be expired

#### 4. Test Authentication Endpoints

Use these test endpoints to debug:

```bash
# Test authentication (requires valid token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/users/test-auth

# Test admin authorization (requires admin role)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/users/test-admin
```

#### 5. Check Frontend Authentication

In browser console, check:

```javascript
// Check if user is logged in
console.log('User:', JSON.parse(localStorage.getItem('user')));

// Check if tokens exist
console.log('Access token:', localStorage.getItem('accessToken'));
console.log('Refresh token:', localStorage.getItem('refreshToken'));
```

#### 6. Common Issues and Solutions

##### Issue: 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Solution**: 
- Check if user is logged in
- Verify token is not expired
- Check token format: `Bearer <token>`

##### Issue: 403 Forbidden
**Cause**: User doesn't have admin role
**Solution**:
- Verify user role in database
- Check if user is active (`is_active: true`)

##### Issue: 400 Bad Request
**Cause**: Validation error
**Solution**:
- Check query parameters (page, limit, name, role)
- Verify parameter types and ranges

##### Issue: 429 Too Many Requests
**Cause**: Rate limiting
**Solution**:
- Wait 15 minutes or check rate limit configuration
- Admin users have higher limits

#### 7. Environment Variables

Ensure these environment variables are set in `.env`:

```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
REFRESH_JWT_SECRET=your_refresh_jwt_secret
```

#### 8. Database Check

Verify the `users` table exists and has the correct structure:

```sql
-- Check if users table exists
SELECT * FROM users LIMIT 1;

-- Check user roles
SELECT id, name, email, role, is_active FROM users;
```

#### 9. Log Analysis

Check backend console logs for:

```
[timestamp] - GET /api/users - User: user_id - Role: admin
Auth middleware called for: { path: '/api/users', method: 'GET' }
Auth verification successful for user: { id: 'user_id', role: 'admin' }
Authorization successful for user: { id: 'user_id', role: 'admin' }
getUsers function called with query: { page: '1', limit: '100' }
```

#### 10. Frontend Debugging

Add this to your frontend code to debug API calls:

```javascript
// In src/services/admin.ts
async getUsers(params?: {
  page?: number;
  limit?: number;
  name?: string;
  role?: string;
}): Promise<UsersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.name) searchParams.append('name', params.name);
  if (params?.role) searchParams.append('role', params.role);

  const url = `${API_BASE_URL}/users?${searchParams}`;
  
  console.log('Making API request to:', url);
  console.log('Headers:', await getAuthHeaders());
  
  const response = await fetch(url, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  return handleResponse(response);
}
```

### Quick Fixes

1. **Restart Backend Server**:
   ```bash
   cd backend
   npm start
   ```

2. **Clear Browser Cache and LocalStorage**:
   ```javascript
   localStorage.clear();
   ```

3. **Check Network Tab**:
   - Open browser DevTools
   - Go to Network tab
   - Make the API request
   - Check request/response details

4. **Verify CORS Configuration**:
   - Check if frontend origin is in CORS allowed origins
   - Verify CORS headers are being sent

### Expected Behavior

**Successful Request Flow**:
1. OPTIONS request → 204 No Content (CORS preflight)
2. GET request → 200 OK with user data
3. Response: `{ users: [...], pagination: {...} }`

**Failed Request Flow**:
1. OPTIONS request → 204 No Content (CORS preflight)
2. GET request → 401/403/400 with error message
3. Response: `{ success: false, message: "Error description" }`

### Still Having Issues?

1. Check the backend console for detailed error logs
2. Verify all environment variables are set correctly
3. Ensure Supabase connection is working
4. Test with a simple curl command first
5. Check if the user exists in the database with correct role 