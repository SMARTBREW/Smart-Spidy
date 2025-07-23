const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const pick = (obj, keys) => keys.reduce((acc, key) => {
  if (obj[key] !== undefined) acc[key] = obj[key];
  return acc;
}, {});

const sanitizeUser = (user) => {
  if (!user) return user;
  const { password_hash, ...rest } = user;
  return {
    id: rest.id,
    name: rest.name,
    email: rest.email,
    role: rest.role,
    isActive: rest.is_active ?? true,
    lastLogin: rest.last_login || null,
    createdAt: rest.created_at || null,
    updatedAt: rest.updated_at || null,
  };
};

const sanitizeSession = (session) => {
  if (!session) return session;
  let sessionDuration = session.session_duration;
  if (session.is_active && !sessionDuration && session.login_time) {
    const loginTime = new Date(session.login_time);
    const now = new Date();
    sessionDuration = Math.floor((now.getTime() - loginTime.getTime()) / 1000);
  }
  return {
    id: session.id,
    userId: session.user_id,
    loginTime: session.login_time,
    logoutTime: session.logout_time,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    sessionDuration,
    isActive: session.is_active,
    createdAt: session.created_at,
    user: session.users ? {
      id: session.users.id,
      name: session.users.name,
      email: session.users.email,
    } : undefined,
  };
};

const createUser = catchAsync(async (req, res) => {
  const { email, password, ...rest } = req.body;
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  if (existingUser) throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  const hashedPassword = await bcrypt.hash(password, 12);
  const userData = { ...rest, email, password_hash: hashedPassword, is_active: true };
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert([userData])
    .select('*')
    .single();
  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  res.status(httpStatus.CREATED).send(sanitizeUser(user));
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  let query = supabaseAdmin.from('users').select('*', { count: 'exact' });
  if (filter.name) query = query.ilike('name', `%${filter.name}%`);
  if (filter.role) query = query.eq('role', filter.role);
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data: users, count, error } = await query;
  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  res.send({
    users: users.map(sanitizeUser),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
  });
});

const getAllUsers = getUsers;

const getUser = catchAsync(async (req, res) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', req.params.id || req.params.userId)
    .single();
  if (error || !user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  res.send(sanitizeUser(user));
});

const getUserById = getUser;

const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError || !user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  if (req.body.email && req.body.email !== user.email) {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', req.body.email)
      .neq('id', id)
      .single();
    if (existingUser) throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const updateData = { ...req.body, updated_at: new Date().toISOString() };
  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !updatedUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found or update failed');
  res.send(sanitizeUser(updatedUser));
});

const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', id)
    .select('id')
    .single();
  if (error || !data) throw new ApiError(httpStatus.NOT_FOUND, 'User not found or delete failed');
  res.status(httpStatus.NO_CONTENT).send();
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { is_active } = req.body;
  const { id } = req.params;
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError || !user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !updatedUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found or update failed');
  res.send(sanitizeUser(updatedUser));
});

const getUserStats = catchAsync(async (_req, res) => {
  const statResults = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
  ]);
  const [total, active, admin] = statResults.map((r) => r.count || 0);
  res.send({
    overall: {
      total,
      active,
      inactive: total - active,
      admins: admin,
      users: total - admin,
    },
  });
});

const getUserSessionStats = catchAsync(async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const statResults = await Promise.all([
    supabaseAdmin.from('user_sessions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('user_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('user_sessions').select('*', { count: 'exact', head: true }).gte('login_time', today),
  ]);
  const [total, active, todayCount] = statResults.map((r) => r.count || 0);
  res.send({
    total,
    active,
    inactive: total - active,
    today: todayCount,
  });
});

const getUserSessions = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const { user_id, is_active } = req.query;
  const offset = (page - 1) * limit;
  let query = supabaseAdmin
    .from('user_sessions')
    .select('*, users(id, name, email)', { count: 'exact' });
  if (user_id) query = query.eq('user_id', user_id);
  if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
  query = query.order('login_time', { ascending: false }).range(offset, offset + limit - 1);
  const { data: sessions, count, error } = await query;
  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  res.send({
    sessions: sessions.map(sanitizeSession),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
  });
});

module.exports = {
  createUser,
  getUsers,
  getAllUsers,
  getUser,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserStats,
  getUserSessionStats,
  getUserSessions,
};