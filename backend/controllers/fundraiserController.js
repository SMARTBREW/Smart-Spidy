const httpStatus = require('http-status');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const pick = (obj, keys) => keys.reduce((acc, key) => {
  if (obj[key] !== undefined) acc[key] = obj[key];
  return acc;
}, {});

const sanitizeFundraiser = (fundraiser) => {
  if (!fundraiser) return fundraiser;
  return {
    id: fundraiser.id,
    name: fundraiser.name,
    createdBy: fundraiser.created_by,
    chatId: fundraiser.chat_id,
    createdAt: fundraiser.created_at || null,
    updatedAt: fundraiser.updated_at || null,
    user: fundraiser.users ? {
      id: fundraiser.users.id,
      name: fundraiser.users.name,
      email: fundraiser.users.email,
    } : undefined,
    chat: fundraiser.chats ? {
      id: fundraiser.chats.id,
      name: fundraiser.chats.name,
      isGold: fundraiser.chats.is_gold,
      status: fundraiser.chats.status,
    } : undefined,
  };
};

const createFundraiser = catchAsync(async (req, res) => {
  const fundraiserData = pick(req.body, ['name', 'created_by', 'chat_id']);
  if (fundraiserData.chat_id) {
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('id, is_gold, user_id, name')
      .eq('id', fundraiserData.chat_id)
      .single();
    if (chatError || !chat) throw new ApiError(httpStatus.BAD_REQUEST, 'Chat not found');
    if (!chat.is_gold) {
      await supabaseAdmin
        .from('chats')
        .update({ is_gold: true, updated_at: new Date().toISOString() })
        .eq('id', fundraiserData.chat_id);
    }
  }
  if (fundraiserData.created_by) {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', fundraiserData.created_by)
      .single();
    if (userError || !user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }
  const { data: fundraiser, error } = await supabaseAdmin
    .from('fundraisers')
    .insert([fundraiserData])
    .select('*, users(id, name, email), chats(id, name, is_gold, status)')
    .single();
  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  res.status(httpStatus.CREATED).send(sanitizeFundraiser(fundraiser));
});

const getFundraisers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'created_by', 'chat_id']);
  const { page = 1, limit = 10, last_week, start_date, end_date } = req.query;
  const offset = (page - 1) * limit;
  let query = supabaseAdmin
    .from('fundraisers')
    .select('*, users(id, name, email), chats(id, name, is_gold, status)', { count: 'exact' });
  if (filter.name) query = query.ilike('name', `%${filter.name}%`);
  if (filter.created_by) query = query.eq('created_by', filter.created_by);
  if (filter.chat_id) query = query.eq('chat_id', filter.chat_id);
  if (last_week === 'true') {
    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    query = query.gte('created_at', lastWeek.toISOString());
  }
  if (start_date && end_date) {
    query = query.gte('created_at', new Date(start_date).toISOString())
                 .lte('created_at', new Date(end_date).toISOString());
  } else if (start_date) {
    query = query.gte('created_at', new Date(start_date).toISOString());
  } else if (end_date) {
    query = query.lte('created_at', new Date(end_date).toISOString());
  }
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data: fundraisers, count, error } = await query;
  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const { count: monthCount, error: monthError } = await supabaseAdmin
    .from('fundraisers')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', monthStart);
  const { count: weekCount, error: weekError } = await supabaseAdmin
    .from('fundraisers')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekStart);
  if (monthError || weekError) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to count fundraisers for month/week');
  }
  res.send({
    fundraisers: fundraisers.map(sanitizeFundraiser),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
    totalFundraisersMonth: monthCount ?? 0,
    totalFundraisersWeek: weekCount ?? 0,
  });
});

const getFundraiser = catchAsync(async (req, res) => {
  const { data: fundraiser, error } = await supabaseAdmin
    .from('fundraisers')
    .select('*, users(id, name, email), chats(id, name, is_gold, status)')
    .eq('id', req.params.id)
    .single();
  if (error || !fundraiser) throw new ApiError(httpStatus.NOT_FOUND, 'Fundraiser not found');
  res.send(sanitizeFundraiser(fundraiser));
});

const updateFundraiser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { data: fundraiser, error: fetchError } = await supabaseAdmin
    .from('fundraisers')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError || !fundraiser) throw new ApiError(httpStatus.NOT_FOUND, 'Fundraiser not found');
  if (req.body.chat_id) {
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('id, is_gold')
      .eq('id', req.body.chat_id)
      .single();
    if (chatError || !chat) throw new ApiError(httpStatus.BAD_REQUEST, 'Chat not found');
    if (!chat.is_gold) {
      await supabaseAdmin
        .from('chats')
        .update({ is_gold: true, updated_at: new Date().toISOString() })
        .eq('id', req.body.chat_id);
    }
  }
  if (req.body.created_by) {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', req.body.created_by)
      .single();
    if (userError || !user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }
  const updateData = { ...req.body, updated_at: new Date().toISOString() };
  const { data: updatedFundraiser, error } = await supabaseAdmin
    .from('fundraisers')
    .update(updateData)
    .eq('id', id)
    .select('*, users(id, name, email), chats(id, name, is_gold, status)')
    .single();
  if (error || !updatedFundraiser) throw new ApiError(httpStatus.NOT_FOUND, 'Fundraiser not found or update failed');
  res.send(sanitizeFundraiser(updatedFundraiser));
});

const deleteFundraiser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { data: fundraiser, error: fetchError } = await supabaseAdmin
    .from('fundraisers')
    .select('chat_id')
    .eq('id', id)
    .single();
  if (fetchError || !fundraiser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fundraiser not found');
  }
  const { data, error } = await supabaseAdmin
    .from('fundraisers')
    .delete()
    .eq('id', id)
    .select('id')
    .single();
  if (error || !data) throw new ApiError(httpStatus.NOT_FOUND, 'Fundraiser not found or delete failed');
  res.status(httpStatus.NO_CONTENT).send();
});

const getFundraiserStats = catchAsync(async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const statResults = await Promise.all([
    supabaseAdmin.from('fundraisers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('fundraisers').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    supabaseAdmin.from('fundraisers').select('*', { count: 'exact', head: true }).gte('created_at', today),
  ]);
  const [total, recent, todayCount] = statResults.map((r) => r.count || 0);
  res.send({
    overall: {
      total,
      recent,
      today: todayCount,
    },
  });
});

module.exports = {
  createFundraiser,
  getFundraisers,
  getFundraiser,
  updateFundraiser,
  deleteFundraiser,
  getFundraiserStats,
};