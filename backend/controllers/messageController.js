const httpStatus = require('http-status');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { generateOpenAIResponse } = require('../services/openaiService');

const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

const sanitizeMessage = (message) => {
  if (!message) return message;
  return {
    id: message.id,
    content: message.content,
    sender: message.sender,
    userId: message.user_id,
    chatId: message.chat_id,
    messageOrder: message.message_order,
    feedback: message.feedback,
    createdAt: message.created_at,
  };
};


const extractInstagramUsername = (content) => {
  const igPattern = /(?:ig|instagram)\s*:\s*([a-zA-Z0-9._]+)/i;
  const match = content.match(igPattern);
  return match ? match[1].trim() : null;
};

const handleInstagramData = async (username, userId) => {
  try {
    const { data: existingAccount } = await supabaseAdmin
      .from('instagram_accounts')
      .select('*')
      .eq('username', username)
      .single();

    if (existingAccount) {
      console.log(`Instagram account @${username} already exists in database`);
      return existingAccount;
    }
    let instagramDetails = null;
    try {
      const instagramService = require('../services/instagramService');
      const { fetchInstagramWithFallback } = instagramService;
      console.log(`Fetching Instagram data for @${username}...`);
      const result = await fetchInstagramWithFallback(undefined, username, true);
      instagramDetails = result.details;
      console.log(`Successfully fetched Instagram data for @${username}`);
    } catch (apiError) {
      console.warn(`Instagram API failed for @${username}:`, apiError.message);
      instagramDetails = {
        username: username,
        full_name: username.charAt(0).toUpperCase() + username.slice(1),
        biography: 'Instagram user',
        followers_count: null,
        media_count: null,
        website: null,
        isSimulated: true
      };
    }
    const instagramData = {
      username: instagramDetails.username,
      full_name: instagramDetails.full_name || instagramDetails.name || username,
      account_type: instagramDetails.account_type || 'PERSONAL',
      biography: instagramDetails.biography || null,
      followers_count: instagramDetails.followers_count || null,
      media_count: instagramDetails.media_count || null,
      website: instagramDetails.website || null,
      profile_picture_url: instagramDetails.profile_picture_url || null,
      fetched_by_user_id: userId,
      fetched_at: new Date().toISOString(),
      raw_json: instagramDetails,
    };
    const { data: savedAccount, error } = await supabaseAdmin
      .from('instagram_accounts')
      .insert([instagramData])
      .select('*')
      .single();

    if (error) {
      console.error('Error saving Instagram account to database:', error);
      return null;
    }

    console.log(`Saved Instagram account @${username} to database`);
    return savedAccount;
  } catch (error) {
    console.error('Error handling Instagram data:', error);
    return null;
  }
};

const createMessage = catchAsync(async (req, res) => {
  const messageData = pick(req.body, [
    'content', 'sender', 'user_id', 'chat_id', 'message_order', 'feedback'
  ]);
  if (!messageData.content || !messageData.sender || !messageData.chat_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Content, sender, and chat_id are required');
  }
  if (!messageData.user_id && req.user) {
    messageData.user_id = req.user.id;
  }
  const instagramUsername = extractInstagramUsername(messageData.content);
  let instagramAccount = null;
  
  if (instagramUsername) {
    instagramAccount = await handleInstagramData(instagramUsername, messageData.user_id);
  }
  const { data: userMessage, error: userError } = await supabaseAdmin
    .from('messages')
    .insert([messageData])
    .select('*')
    .single();

  if (userError) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, userError.message);
  }
  const { data: chat, error: chatFetchError } = await supabaseAdmin
    .from('chats')
    .select('message_count')
    .eq('id', messageData.chat_id)
    .single();
  if (chatFetchError || !chat) {
    console.error('Error fetching chat for message count update:', chatFetchError);
  } else {
    const newCount = (chat.message_count || 0) + 1;
    const { error: updateError } = await supabaseAdmin
      .from('chats')
      .update({ 
        message_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageData.chat_id);
    if (updateError) {
      console.error('Error updating chat message count:', updateError);
    }
  }
  if (messageData.sender === 'user') {
    let assistantContent = '';
    try {
      assistantContent = await generateOpenAIResponse(messageData.content);
    } catch (err) {
      assistantContent = 'Sorry, I could not generate a response at this time.';
      console.error('OpenAI error:', err);
    }
    const assistantMessageData = {
      content: assistantContent,
      sender: 'assistant',
      user_id: null, // or messageData.user_id if you want to associate
      chat_id: messageData.chat_id,
      message_order: (typeof messageData.message_order === 'number' ? messageData.message_order + 1 : 1),
      feedback: null,
    };
    const { data: assistantMessage, error: assistantError } = await supabaseAdmin
      .from('messages')
      .insert([assistantMessageData])
      .select('*')
      .single();
    if (assistantError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, assistantError.message);
    }
    const { data: chat2, error: chatFetchError2 } = await supabaseAdmin
      .from('chats')
      .select('message_count')
      .eq('id', messageData.chat_id)
      .single();
    if (chatFetchError2 || !chat2) {
      console.error('Error fetching chat for message count update:', chatFetchError2);
    } else {
      const newCount2 = (chat2.message_count || 0) + 1;
      const { error: updateError2 } = await supabaseAdmin
        .from('chats')
        .update({ 
          message_count: newCount2,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageData.chat_id);
      if (updateError2) {
        console.error('Error updating chat message count:', updateError2);
      }
    }
    return res.status(httpStatus.CREATED).send({
      messages: [sanitizeMessage(userMessage), sanitizeMessage(assistantMessage)],
      instagramAccount: instagramAccount ? {
        id: instagramAccount.id,
        username: instagramAccount.username,
        fullName: instagramAccount.full_name,
        biography: instagramAccount.biography,
        followersCount: instagramAccount.followers_count,
        mediaCount: instagramAccount.media_count,
      } : null
    });
  }
  return res.status(httpStatus.CREATED).send({
    messages: [sanitizeMessage(userMessage)],
    instagramAccount: instagramAccount ? {
      id: instagramAccount.id,
      username: instagramAccount.username,
      fullName: instagramAccount.full_name,
      biography: instagramAccount.biography,
      followersCount: instagramAccount.followers_count,
      mediaCount: instagramAccount.media_count,
    } : null
  });
});

const getMessages = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const { data: chat, error: chatError } = await supabaseAdmin
    .from('chats')
    .select('user_id')
    .eq('id', chatId)
    .single();

  if (chatError || !chat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }
  if (req.user.role !== 'admin' && chat.user_id !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  const { data: messages, count, error } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('chat_id', chatId)
    .order('message_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  res.send({
    messages: messages.map(sanitizeMessage),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
  });
});

const getMessage = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .select('*, chats(user_id)')
    .eq('id', id)
    .single();

  if (error || !message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }
  if (req.user.role !== 'admin' && message.chats.user_id !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  res.send(sanitizeMessage(message));
});

const updateMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = pick(req.body, ['content', 'feedback']);
  const { data: currentMessage, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('*, chats(user_id)')
    .eq('id', id)
    .single();

  if (fetchError || !currentMessage) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }
  if (req.user.role !== 'admin' && currentMessage.chats.user_id !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  const { data: updatedMessage, error } = await supabaseAdmin
    .from('messages')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  res.send(sanitizeMessage(updatedMessage));
});

const deleteMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { data: currentMessage, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('*, chats(user_id)')
    .eq('id', id)
    .single();

  if (fetchError || !currentMessage) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }
  if (req.user.role !== 'admin' && currentMessage.chats.user_id !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', id);
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  const { data: chat, error: chatFetchError } = await supabaseAdmin
    .from('chats')
    .select('message_count')
    .eq('id', currentMessage.chat_id)
    .single();
  if (chatFetchError || !chat) {
    console.error('Error fetching chat for message count update:', chatFetchError);
  } else {
    const newCount = Math.max((chat.message_count || 1) - 1, 0);
    const { error: updateError } = await supabaseAdmin
      .from('chats')
      .update({ 
        message_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentMessage.chat_id);
    if (updateError) {
      console.error('Error updating chat message count:', updateError);
    }
  }

  res.status(httpStatus.NO_CONTENT).send();
});

const createMessages = catchAsync(async (req, res) => {
  const { messages, chat_id } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Messages array is required');
  }

  if (!chat_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Chat ID is required');
  }
  const { data: chat, error: chatError } = await supabaseAdmin
    .from('chats')
    .select('user_id, message_count')
    .eq('id', chat_id)
    .single();

  if (chatError || !chat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }

  if (req.user.role !== 'admin' && chat.user_id !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  const messagesToInsert = messages.map((msg, index) => ({
    content: msg.content,
    sender: msg.sender,
    user_id: msg.user_id || req.user.id,
    chat_id: chat_id,
    message_order: msg.message_order || index,
    feedback: msg.feedback || null,
  }));
  const instagramAccounts = [];
  for (const msg of messagesToInsert) {
    const instagramUsername = extractInstagramUsername(msg.content);
    if (instagramUsername) {
      const account = await handleInstagramData(instagramUsername, msg.user_id);
      if (account) {
        instagramAccounts.push(account);
      }
    }
  }
  const { data: createdMessages, error } = await supabaseAdmin
    .from('messages')
    .insert(messagesToInsert)
    .select('*');
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  const newCount = (chat.message_count || 0) + messagesToInsert.length;
  const { error: updateError } = await supabaseAdmin
    .from('chats')
    .update({ 
      message_count: newCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', chat_id);
  if (updateError) {
    console.error('Error updating chat message count:', updateError);
  }
  res.status(httpStatus.CREATED).send({
    messages: createdMessages.map(sanitizeMessage),
    instagramAccounts: instagramAccounts.map(account => ({
      id: account.id,
      username: account.username,
      fullName: account.full_name,
      biography: account.biography,
      followersCount: account.followers_count,
      mediaCount: account.media_count,
    }))
  });
});

module.exports = {
  createMessage,
  getMessages,
  getMessage,
  updateMessage,
  deleteMessage,
  createMessages,
}; 