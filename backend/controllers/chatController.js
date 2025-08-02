const httpStatus = require('http-status');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

const sanitizeChat = (chat) => {
  if (!chat) return chat;
  return {
    id: chat.id,
    name: chat.name,
    userId: chat.user_id,
    pinned: chat.pinned ?? false,
    pinnedAt: chat.pinned_at,
    status: chat.status, 
    isGold: chat.is_gold ?? false, 
    messageCount: chat.message_count ?? 0,
    createdAt: chat.created_at || null,
    updatedAt: chat.updated_at || null,
    instagramUsername: chat.instagram_username,
    profession: chat.profession,
    product: chat.product,
    gender: chat.gender,
    user: chat.users
      ? {
          id: chat.users.id,
          name: chat.users.name,
          email: chat.users.email,
        }
      : undefined,
  };
};

const createChat = catchAsync(async (req, res) => {
  const chatData = pick(req.body, [
    'name', 'user_id', 'instagram_username', 'profession', 'product', 'gender',
  ]);
  const { data: chat, error } = await supabaseAdmin
    .from('chats')
    .insert([{ ...chatData, pinned: false, message_count: 0, is_gold: false }])
    .select('*, users(id, name, email)')
    .single();
  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  res.status(httpStatus.CREATED).send(sanitizeChat(chat));
});

const getChats = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'name',
    'status',
    'is_gold',
    'pinned',
    'user_id',
    'profession',
    'product',
    'gender',
  ]);
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  let query = supabaseAdmin
    .from('chats')
    .select('*, users(id, name, email)', { count: 'exact' });
  if (req.user.role !== 'admin') {
    query = query.eq('user_id', req.user.id);
  } else if (filter.user_id) {
    query = query.eq('user_id', filter.user_id);
  }
  if (filter.name) query = query.ilike('name', `%${filter.name}%`);
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.is_gold !== undefined) query = query.eq('is_gold', filter.is_gold === 'true');
  if (filter.pinned !== undefined) query = query.eq('pinned', filter.pinned === 'true');
  if (filter.profession) query = query.eq('profession', filter.profession);
  if (filter.product) query = query.ilike('product', `%${filter.product}%`);
  if (filter.gender) query = query.eq('gender', filter.gender);
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data: chats, count, error } = await query;
  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  const { count: pinnedCount, error: pinnedError } = await supabaseAdmin
    .from('chats')
    .select('id', { count: 'exact', head: true })
    .eq('pinned', true);
  const { count: goldCount, error: goldError } = await supabaseAdmin
    .from('chats')
    .select('id', { count: 'exact', head: true })
    .eq('is_gold', true);
  if (pinnedError || goldError) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to count pinned/gold chats');
  }
  res.send({
    chats: chats.map(sanitizeChat),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
    totalPinnedChats: pinnedCount ?? 0,
    totalGoldChats: goldCount ?? 0,
  });
});

const getChat = catchAsync(async (req, res) => {
  const { data: chat, error } = await supabaseAdmin
    .from('chats')
    .select('*, users(id, name, email)')
    .eq('id', req.params.id)
    .single();
  if (error || !chat) throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  res.send(sanitizeChat(chat));
});

const updateChat = catchAsync(async (req, res) => {
  const updateData = { ...req.body, updated_at: new Date().toISOString() };
  const { data: updatedChat, error } = await supabaseAdmin
    .from('chats')
    .update(updateData)
    .eq('id', req.params.id)
    .select('*, users(id, name, email)')
    .single();
  if (error || !updatedChat) throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found or update failed');
  res.send(sanitizeChat(updatedChat));
});

const deleteChat = catchAsync(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('chats')
    .delete()
    .eq('id', req.params.id)
    .select('id')
    .single();
  if (error || !data) throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found or delete failed');
  res.status(httpStatus.NO_CONTENT).send();
});

const getChatStats = catchAsync(async (_req, res) => {
  const statuses = ['green', 'yellow', 'red'];
  const statResults = await Promise.all([
    supabaseAdmin.from('chats').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('chats').select('*', { count: 'exact', head: true }).eq('pinned', true),
    supabaseAdmin.from('chats').select('*', { count: 'exact', head: true }).eq('is_gold', true),
    ...statuses.map((status) =>
      supabaseAdmin.from('chats').select('*', { count: 'exact', head: true }).eq('status', status)
    ),
  ]);
  const [total, pinned, gold, ...statusCounts] = statResults.map((r) => r.count || 0);
  const totalChats = total || 0;
  const pinnedChats = pinned || 0;
  const goldChats = gold || 0;
  const [greenChats, yellowChats, redChats] = statusCounts;
  res.send({
    overall: {
      total: totalChats,
      pinned: pinnedChats,
      unpinned: totalChats - pinnedChats,
      gold: goldChats,
    },
    byStatus: {
      green: greenChats,
      yellow: yellowChats,
      red: redChats,
      none: totalChats - greenChats - yellowChats - redChats,
    },
  });
});

const updateChatStatus = catchAsync(async (req, res) => {
  const { status, makeGold } = req.body; 
  const { id } = req.params;
  const { data: currentChat, error: fetchError } = await supabaseAdmin
    .from('chats')
    .select('status, is_gold, user_id, name')
    .eq('id', id)
    .single();
  if (fetchError || !currentChat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }
  const updateData = { updated_at: new Date().toISOString() };
  if (status !== undefined) {
    const validStatuses = ['green', 'yellow', 'red', null];
    if (!validStatuses.includes(status)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status. Must be green, yellow, red, or null');
    }
    updateData.status = status;
  }
  if (makeGold !== undefined) {
    if (makeGold === false && currentChat.is_gold === true) {
      throw new ApiError(
        httpStatus.BAD_REQUEST, 
        'Cannot remove gold status. Once a chat is set to gold and has become fundraiser, the gold status cannot be removed Samjha.'
      );
    }
    if (makeGold === true) {
      updateData.is_gold = true;
      if (!updateData.hasOwnProperty('status')) {
        updateData.status = currentChat.status;
      }
    }
  }
  const { data: updatedChat, error } = await supabaseAdmin
    .from('chats')
    .update(updateData)
    .eq('id', id)
    .select('*, users(id, name, email)')
    .single();
  if (error || !updatedChat) throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  if (updateData.is_gold === true) {
    const { data: existingFundraiser } = await supabaseAdmin
      .from('fundraisers')
      .select('*')
      .eq('chat_id', id)
      .single();
    if (!existingFundraiser) {
      const { data: fundraiser, error: fundraiserError } = await supabaseAdmin
        .from('fundraisers')
        .insert([{ name: updatedChat.name, created_by: updatedChat.user_id, chat_id: id }])
        .select('*')
        .single();
      if (fundraiserError) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, fundraiserError.message);
      return res.send({ chat: sanitizeChat(updatedChat), fundraiser });
    }
    return res.send({ chat: sanitizeChat(updatedChat), fundraiser: existingFundraiser });
  }
  res.send(sanitizeChat(updatedChat));
});

const pinChat = catchAsync(async (req, res) => {
  const { pinned } = req.body;
  const { id } = req.params;
  const { data: chat, error: fetchError } = await supabaseAdmin
    .from('chats')
    .select('user_id')
    .eq('id', id)
    .single();
  if (fetchError || !chat) throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  if (pinned) {
    const { count: pinnedCount, error: countError } = await supabaseAdmin
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', chat.user_id)
      .eq('pinned', true);
    if (countError) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to count pinned chats');
    if (pinnedCount >= 5) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You can only pin up to 5 chats. Unpin another chat first.');
    }
  }
  const updateData = {
    pinned,
    pinned_at: pinned ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  const { data: updatedChat, error } = await supabaseAdmin
    .from('chats')
    .update(updateData)
    .eq('id', id)
    .select('*, users(id, name, email)')
    .single();
  if (error || !updatedChat) throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  res.send(sanitizeChat(updatedChat));
});

const searchChats = catchAsync(async (req, res) => {
  const { q: query, page = 1, limit = 20, include_messages = true } = req.query;
  const offset = (page - 1) * limit;
  let chatQuery = supabaseAdmin
    .from('chats')
    .select('*, users(id, name, email)', { count: 'exact' });
  if (req.user.role !== 'admin') {
    chatQuery = chatQuery.eq('user_id', req.user.id);
  } else {
    if (req.query.user_id) {
      chatQuery = chatQuery.eq('user_id', req.query.user_id);
    } else {
      chatQuery = chatQuery.eq('user_id', req.user.id);
    }
  }
  const statusKeywords = ['green', 'yellow', 'red'];
  const isStatusSearch = statusKeywords.includes(query.toLowerCase());
  if (isStatusSearch) {
    const status = query.toLowerCase();
    chatQuery = chatQuery.eq('status', status).eq('is_gold', false);
  } else {
    chatQuery = chatQuery.or(`name.ilike.%${query}%`);
  }
  const { data: chats, count: chatCount, error: chatError } = await chatQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (chatError) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, chatError.message);
  let messageResults = [];
  if (include_messages) {
    let userChatIdsQuery = supabaseAdmin
      .from('chats')
      .select('id');
    if (req.user.role !== 'admin') {
      userChatIdsQuery = userChatIdsQuery.eq('user_id', req.user.id);
    } else {
      if (req.query.user_id) {
        userChatIdsQuery = userChatIdsQuery.eq('user_id', req.query.user_id);
      } else {
        userChatIdsQuery = userChatIdsQuery.eq('user_id', req.user.id);
      }
    }
    const { data: userChatIds, error: chatIdsError } = await userChatIdsQuery;
    if (chatIdsError) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, chatIdsError.message);
    if (userChatIds && userChatIds.length > 0) {
      const chatIds = userChatIds.map(chat => chat.id);
      let messageQuery = supabaseAdmin
        .from('messages')
        .select('*, chats(id, name, user_id, pinned, status, is_gold, created_at, users(id, name, email))')
        .in('chat_id', chatIds);
      
      if (isStatusSearch) {
        const status = query.toLowerCase();
        messageQuery = messageQuery.eq('chats.status', status).eq('chats.is_gold', false);
      } else {
        messageQuery = messageQuery.or(`content.ilike.%${query}%`);
      }

      const { data: messages, error: messageError } = await messageQuery
        .order('created_at', { ascending: false })
        .limit(limit);
      if (messageError) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, messageError.message);
      const chatMessageMap = new Map();
      messages.forEach(msg => {
        if (!chatMessageMap.has(msg.chat_id)) {
          chatMessageMap.set(msg.chat_id, {
            chat: sanitizeChat(msg.chats),
            messages: []
          });
        }
        chatMessageMap.get(msg.chat_id).messages.push({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          created_at: msg.created_at,
          message_order: msg.message_order
        });
      });
      messageResults = Array.from(chatMessageMap.values());
    }
  }
  const chatIds = new Set(chats.map(chat => chat.id));
  const uniqueMessageResults = messageResults.filter(result => !chatIds.has(result.chat.id));
  const combinedResults = [
    ...chats.map(chat => ({ chat: sanitizeChat(chat), messages: [] })),
    ...uniqueMessageResults
  ];
  res.send({
    results: combinedResults,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: chatCount + uniqueMessageResults.length,
      pages: Math.ceil((chatCount + uniqueMessageResults.length) / limit),
    },
    query: query
  });
});

module.exports = {
  createChat,
  getChats,
  getChat,
  updateChat,
  deleteChat,
  getChatStats,
  updateChatStatus,
  pinChat,
  searchChats,
};