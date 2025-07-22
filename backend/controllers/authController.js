const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

// Helper to remove sensitive fields
const sanitizeUser = (user) => {
  if (!user) return user;
  const { password_hash, ...rest } = user;
  
  // Transform snake_case to camelCase for frontend compatibility
  return {
    id: rest.id,
    name: rest.name,
    email: rest.email,
    role: rest.role,
    isActive: rest.is_active ?? true,
    lastLogin: rest.last_login || null,
    createdAt: rest.created_at || null,
    updatedAt: rest.updated_at || null
  };
};

const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const generateAuthTokens = (user) => {
  const accessTokenExpires = config.jwt.accessExpirationMinutes * 60;
  const refreshTokenExpires = config.jwt.refreshExpirationDays * 24 * 60 * 60;

  const accessToken = generateToken(
    { sub: user.id, type: 'access' },
    config.jwt.secret,
    `${accessTokenExpires}s`
  );

  const refreshToken = generateToken(
    { sub: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    `${refreshTokenExpires}s`
  );

  return {
    access: {
      token: accessToken,
      expires: new Date(Date.now() + accessTokenExpires * 1000),
    },
    refresh: {
      token: refreshToken,
      expires: new Date(Date.now() + refreshTokenExpires * 1000),
    },
  };
};

const register = catchAsync(async (req, res) => {
  const { email, password, ...rest } = req.body;

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert([{ email, password_hash: hashedPassword, ...rest, is_active: true }])
    .select('*')
    .single();

  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);

  const tokens = generateAuthTokens(user);

  res.status(httpStatus.CREATED).send({
    user: sanitizeUser(user),
    tokens
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (error || !user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  // Parallel operations for better performance
  const currentTime = new Date().toISOString();
  const tokens = generateAuthTokens(user);

  const [updateResult, sessionResult] = await Promise.allSettled([
    // Update user's last login
    supabaseAdmin
      .from('users')
      .update({
        last_login: currentTime,
        updated_at: currentTime,
      })
      .eq('id', user.id),
    
    // Create user session
    supabaseAdmin
      .from('user_sessions')
      .insert([{ 
        user_id: user.id, 
        login_time: currentTime,
        is_active: true 
      }])
      .select('*')
      .single()
  ]);

  // Log any errors but don't fail the login
  if (updateResult.status === 'rejected') {
    console.error('Failed to update last login:', updateResult.reason);
  }
  
  let sessionId = null;
  if (sessionResult.status === 'fulfilled') {
    sessionId = sessionResult.value.data?.id;
  } else {
    console.error('Failed to create user session:', sessionResult.reason);
  }

  res.send({
    user: sanitizeUser(user),
    tokens,
    session_id: sessionId
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required');
  }

  try {
    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const userId = payload.sub;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
    }

    const tokens = generateAuthTokens(user);
    res.send({ tokens });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
});

const getProfile = catchAsync(async (req, res) => {
  // The user is already authenticated and available in req.user from the auth middleware
  res.send(sanitizeUser(req.user));
});

const logout = catchAsync(async (req, res) => {
  const { session_id } = req.body;
  const userId = req.user.id;

  if (session_id) {
    // Update the specific session
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single();

    if (!fetchError && session) {
      const logoutTime = new Date().toISOString();
      const sessionDuration = Math.floor((new Date(logoutTime) - new Date(session.login_time)) / 1000);

      await supabaseAdmin
        .from('user_sessions')
        .update({ 
          logout_time: logoutTime,
          session_duration: sessionDuration,
          is_active: false 
        })
        .eq('id', session_id);
    }
  } else {
    // Logout all active sessions for the user
    await supabaseAdmin
      .from('user_sessions')
      .update({ 
        logout_time: new Date().toISOString(),
        is_active: false 
      })
      .eq('user_id', userId)
      .eq('is_active', true);
  }

  res.status(httpStatus.OK).send({ message: 'Logged out successfully' });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
}; 