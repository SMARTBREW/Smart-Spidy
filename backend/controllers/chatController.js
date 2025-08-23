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
    executiveInstagramUsername: chat.executive_instagram_username,
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
    'name', 'user_id', 'instagram_username', 'executive_instagram_username', 'profession', 'product', 'gender',
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
  const { page = 1, limit = 10, time_filter, start_date, end_date } = req.query;
  const offset = (page - 1) * limit;
  let query = supabaseAdmin
    .from('chats')
    .select('*, users(id, name, email)', { count: 'exact' });
  if (req.user.role !== 'admin') {
    query = query.eq('user_id', req.user.id);
  } else if (filter.user_id) {
    query = query.eq('user_id', filter.user_id);
  }
  
  // Enhanced search: search by chat name, user name, or user email
  if (filter.name) {
    // First, get user IDs that match the search term
    const { data: matchingUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`name.ilike.%${filter.name}%,email.ilike.%${filter.name}%`);
    
    if (userError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, userError.message);
    }
    
    const matchingUserIds = matchingUsers?.map(user => user.id) || [];
    
    // Then search in chat names and user IDs
    if (matchingUserIds.length > 0) {
      query = query.or(`name.ilike.%${filter.name}%,user_id.in.(${matchingUserIds.join(',')})`);
    } else {
      query = query.ilike('name', `%${filter.name}%`);
    }
  }
  
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.is_gold !== undefined) query = query.eq('is_gold', filter.is_gold === 'true');
  if (filter.pinned !== undefined) {
    query = query.eq('pinned', filter.pinned === 'true');
  }
  if (filter.profession) query = query.eq('profession', filter.profession);
  if (filter.product) query = query.ilike('product', `%${filter.product}%`);
  if (filter.gender) query = query.eq('gender', filter.gender);
  
  // Apply time filtering
  const now = new Date();
  if (time_filter === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    query = query.gte('created_at', todayStart).lt('created_at', todayEnd);
  } else if (time_filter === 'last_week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', weekAgo);
  } else if (time_filter === 'last_month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', monthAgo);
  } else if (time_filter === 'custom' && start_date && end_date) {
    const startDateTime = new Date(start_date).toISOString();
    const endDateTime = new Date(new Date(end_date).getTime() + 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', startDateTime).lt('created_at', endDateTime);
  } else if (start_date && !end_date) {
    query = query.gte('created_at', new Date(start_date).toISOString());
  } else if (end_date && !start_date) {
    query = query.lt('created_at', new Date(new Date(end_date).getTime() + 24 * 60 * 60 * 1000).toISOString());
  }
  
  query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data: chats, count, error } = await query;
  if (error) {
    // Handle range error gracefully - return empty result if offset is beyond data
    if (error.message.includes('range not satisfiable') || error.message.includes('Requested range not satisfiable')) {
      return res.send({
        chats: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0,
        },
        totalPinnedChats: 0,
        totalGoldChats: 0,
      });
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  // Create separate queries for analytics (same filters as main query)
  let pinnedQuery = supabaseAdmin.from('chats').select('id', { count: 'exact', head: true }).eq('pinned', true);
  let goldQuery = supabaseAdmin.from('chats').select('id', { count: 'exact', head: true }).eq('is_gold', true);
  
  if (req.user.role !== 'admin') {
    pinnedQuery = pinnedQuery.eq('user_id', req.user.id);
    goldQuery = goldQuery.eq('user_id', req.user.id);
  } else if (filter.user_id) {
    pinnedQuery = pinnedQuery.eq('user_id', filter.user_id);
    goldQuery = goldQuery.eq('user_id', filter.user_id);
  }
  
  // Apply same time filtering to analytics
  if (time_filter === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    pinnedQuery = pinnedQuery.gte('created_at', todayStart).lt('created_at', todayEnd);
    goldQuery = goldQuery.gte('created_at', todayStart).lt('created_at', todayEnd);
  } else if (time_filter === 'last_week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    pinnedQuery = pinnedQuery.gte('created_at', weekAgo);
    goldQuery = goldQuery.gte('created_at', weekAgo);
  } else if (time_filter === 'last_month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    pinnedQuery = pinnedQuery.gte('created_at', monthAgo);
    goldQuery = goldQuery.gte('created_at', monthAgo);
  } else if (time_filter === 'custom' && start_date && end_date) {
    const startDateTime = new Date(start_date).toISOString();
    const endDateTime = new Date(new Date(end_date).getTime() + 24 * 60 * 60 * 1000).toISOString();
    pinnedQuery = pinnedQuery.gte('created_at', startDateTime).lt('created_at', endDateTime);
    goldQuery = goldQuery.gte('created_at', startDateTime).lt('created_at', endDateTime);
  } else if (start_date && !end_date) {
    pinnedQuery = pinnedQuery.gte('created_at', new Date(start_date).toISOString());
    goldQuery = goldQuery.gte('created_at', new Date(start_date).toISOString());
  } else if (end_date && !start_date) {
    const endDateTime = new Date(new Date(end_date).getTime() + 24 * 60 * 60 * 1000).toISOString();
    pinnedQuery = pinnedQuery.lt('created_at', endDateTime);
    goldQuery = goldQuery.lt('created_at', endDateTime);
  }
  
  const { count: pinnedCount, error: pinnedError } = await pinnedQuery;
  const { count: goldCount, error: goldError } = await goldQuery;
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

const updateChatActivity = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if chat exists and user has access
  const { data: chat, error: fetchError } = await supabaseAdmin
    .from('chats')
    .select('user_id')
    .eq('id', id)
    .single();
  
  if (fetchError || !chat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }
  
  // Check if user has access to this chat
  if (req.user.role !== 'admin' && chat.user_id !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  
  // Update the chat's activity timestamp to move it to the top
  const updateData = {
    updated_at: new Date().toISOString(),
    last_activity: new Date().toISOString()
  };
  
  const { data: updatedChat, error } = await supabaseAdmin
    .from('chats')
    .update(updateData)
    .eq('id', id)
    .select('*, users(id, name, email)')
    .single();
    
  if (error || !updatedChat) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update chat activity');
  }
  
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
    // Enhanced search: search by chat name, user name, or user email
    // First, get user IDs that match the search term
    const { data: matchingUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`);
    
    if (userError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, userError.message);
    }
    
    const matchingUserIds = matchingUsers?.map(user => user.id) || [];
    
    // Then search in chat names and user IDs
    if (matchingUserIds.length > 0) {
      chatQuery = chatQuery.or(`name.ilike.%${query}%,user_id.in.(${matchingUserIds.join(',')})`);
    } else {
      chatQuery = chatQuery.ilike('name', `%${query}%`);
    }
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

// New function to get all chats for a user (unlimited) - for sidebar use
const getAllChatsForUser = catchAsync(async (req, res) => {
  const { user_id } = req.query;
  let query = supabaseAdmin
    .from('chats')
    .select('*, users(id, name, email)');
  
  if (req.user.role !== 'admin') {
    query = query.eq('user_id', req.user.id);
  } else if (user_id) {
    query = query.eq('user_id', user_id);
  }
  
  query = query.order('updated_at', { ascending: false });
  const { data: chats, error } = await query;
  
  if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  
  res.send({
    chats: chats.map(sanitizeChat),
    total: chats.length
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
  getAllChatsForUser,
  updateChatActivity,
};