const httpStatus = require('http-status');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { generateOpenAIResponse, generateEnhancedDMVariations } = require('../services/openaiService');
const { analyzeInstagramAccount } = require('../services/openaiService');
const { getCampaignDM, replaceDMTemplate, isFirstDMRequest } = require('../services/campaignService');
const { updateChatLastActivity, updateFundraiserLastActivity } = require('../services/notificationService');

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
    feedback: message.feedback ?? null,
    createdAt: message.created_at,
    chat: message.chats ? {
      id: message.chats.id,
      name: message.chats.name,
      user_id: message.chats.user_id,
    } : undefined,
  };
};

const extractInstagramUsername = (content) => {
  const livePattern = /(?:ig|instagram)\s*::\s*([a-zA-Z0-9._]+)/i;
  const cachedPattern = /(?:ig|instagram)\s*:\s*([a-zA-Z0-9._]+)/i;
  if (livePattern.test(content)) {
    return { username: content.match(livePattern)[1].trim(), forceLive: true };
  } else if (cachedPattern.test(content)) {
    return { username: content.match(cachedPattern)[1].trim(), forceLive: false };
  }
  return null;
};

const handleInstagramData = async (username, userId, forceLive = false) => {
  try {
    let didLiveFetch = false;
    if (!forceLive) {
      const { data: existingAccount } = await supabaseAdmin
        .from('instagram_accounts')
        .select('*')
        .eq('username', username)
        .single();
      if (existingAccount) {
        return { ...existingAccount, source: 'database' };
      }
    } else {
      didLiveFetch = true;
    }
    let instagramDetails = null;
    try {
      const instagramService = require('../services/instagramService');
      const { fetchInstagramWithFallback } = instagramService;
      const result = await fetchInstagramWithFallback(undefined, username, false);
      instagramDetails = result.details;
    } catch (apiError) {
      console.warn(`Instagram API failed for @${username}:`, apiError.message);
      return null;
    }
    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeInstagramAccount(instagramDetails);
    } catch (aiError) {
      console.warn(`AI analysis failed for @${username}:`, aiError.message);
    }

    const instagramData = {
      ig_user_id: instagramDetails.ig_id || instagramDetails.id || null,
      username: instagramDetails.username,
      name: instagramDetails.name || username,
      biography: instagramDetails.biography || null,
      website: instagramDetails.website || null,
      followers_count: instagramDetails.followers_count || null,
      follows_count: instagramDetails.follows_count || null,
      media_count: instagramDetails.media_count || null,
      account_type: instagramDetails.account_type || 'BUSINESS',
      is_verified: instagramDetails.is_verified || false,
      ig_id: instagramDetails.ig_id || null,
      audience_gender_age: instagramDetails.audience_gender_age || null,
      audience_country: instagramDetails.audience_country || null,
      audience_city: instagramDetails.audience_city || null,
      audience_locale: instagramDetails.audience_locale || null,
      insights: instagramDetails.insights || null,
      mentions: instagramDetails.mentions || null,
      media: instagramDetails.media || null,
      ai_analysis_score: aiAnalysis ? aiAnalysis.score : null,
      ai_analysis_details: aiAnalysis ? aiAnalysis.details : null,
      fetched_by_user_id: userId,
      fetched_at: new Date().toISOString(),
      raw_json: instagramDetails,
    };
    const { error } = await supabaseAdmin
      .from('instagram_accounts')
      .upsert([instagramData], { onConflict: 'username' });
    if (error) {
      console.error('Error saving Instagram account to database:', error);
      return null;
    }
    const { data: savedAccount } = await supabaseAdmin
      .from('instagram_accounts')
      .select('*')
      .eq('username', username)
      .single();
    if (!savedAccount) {
      console.error('Error: Instagram account not found in DB after saving');
      return null;
    }
    return { ...savedAccount, source: 'live' };
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
    instagramAccount = await handleInstagramData(instagramUsername.username, messageData.user_id, instagramUsername.forceLive);
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
    const chatUpdateData = { 
      message_count: newCount,
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };
    const { error: updateError } = await supabaseAdmin
      .from('chats')
      .update(chatUpdateData)
      .eq('id', messageData.chat_id);
    if (updateError) {
      console.error('Error updating chat message count:', updateError);
    } else {
      await updateChatLastActivity(messageData.chat_id);
    }
  }
  if (messageData.sender === 'user') {
    let assistantContent = '';
    try {
      const isFirstDM = isFirstDMRequest(messageData.content);
      if (isFirstDM) {
        const { data: chatDetails, error: chatError } = await supabaseAdmin
          .from('chats')
          .select('name, profession, product')
          .eq('id', messageData.chat_id)
          .single();
        if (chatError || !chatDetails) {
          console.error('Error fetching chat details:', chatError);
          assistantContent = 'Sorry, I could not retrieve the campaign DM template at this time.';
        } else {
          const { name: chatName, profession, product } = chatDetails;
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('name')
            .eq('id', messageData.user_id)
            .single();
          const volunteerName = userData?.name || 'Smart Spidy Team';
          const campaign = product || 'Pads For Freedom';
          const campaignDM = await getCampaignDM(profession, campaign);
          if (campaignDM && campaignDM.template) {
            assistantContent = replaceDMTemplate(campaignDM.template, chatName, volunteerName);
          } else {
            assistantContent = `I couldn't find a specific campaign DM template for ${profession} in the ${campaign} campaign. Here's a general template you can customize:\n\nHello ${chatName},\n\nI hope you're doing well! I'm reaching out regarding our ${campaign} campaign. We'd love to have you as a campaign ambassador to help spread awareness about this important cause.\n\nWould you be interested in learning more about how you can get involved?\n\nBest regards,\n${volunteerName}`;
          }
        }
      } else {
        const { data: chatForContext, error: chatContextError } = await supabaseAdmin
          .from('chats')
          .select('product, profession, name')
          .eq('id', messageData.chat_id)
          .single();
        if (chatContextError) {
          console.error('Error fetching chat context:', chatContextError);
        }
        const { data: conversationHistory, error: historyError } = await supabaseAdmin
          .from('messages')
          .select('content, sender, created_at')
          .eq('chat_id', messageData.chat_id)
          .order('created_at', { ascending: true })
          .limit(20); 
        if (historyError) {
          console.error('Error fetching conversation history:', historyError);
        }
        const contextDetails = chatContextError ? null : chatForContext;
        const chatHistory = historyError ? [] : (conversationHistory || []);
        assistantContent = await generateOpenAIResponse(messageData.content, contextDetails, chatHistory);
      }
    } catch (err) {
      assistantContent = 'Sorry, I could not generate a response at this time.';
      console.error('Response generation error:', err);
    }
    const assistantMessageData = {
      content: assistantContent,
      sender: 'assistant',
      user_id: null, 
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
        igUserId: instagramAccount.ig_user_id,
        username: instagramAccount.username,
        name: instagramAccount.name,
        biography: instagramAccount.biography,
        website: instagramAccount.website,
        followersCount: instagramAccount.followers_count,
        followsCount: instagramAccount.follows_count,
        mediaCount: instagramAccount.media_count,
        accountType: instagramAccount.account_type,
        isVerified: instagramAccount.is_verified,
        igId: instagramAccount.ig_id,
        audienceGenderAge: instagramAccount.audience_gender_age,
        audienceCountry: instagramAccount.audience_country,
        audienceCity: instagramAccount.audience_city,
        audienceLocale: instagramAccount.audience_locale,
        insights: instagramAccount.insights,
        mentions: instagramAccount.mentions,
        media: instagramAccount.media,
        fetchedAt: instagramAccount.fetched_at,
        hasDetailedAccess: !!(instagramAccount.insights || instagramAccount.media || instagramAccount.audience_gender_age),
        totalLikesCount: instagramAccount.media ? 
          instagramAccount.media.reduce((sum, post) => sum + (post.like_count || 0), 0) : null,
        totalCommentsCount: instagramAccount.media ? 
          instagramAccount.media.reduce((sum, post) => sum + (post.comments_count || 0), 0) : null,
        lastPostDate: instagramAccount.media && instagramAccount.media.length > 0 ? 
          instagramAccount.media
            .filter(post => post.timestamp)
            .map(post => new Date(post.timestamp))
            .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() : null,
        aiAnalysisScore: instagramAccount.ai_analysis_score,
        aiAnalysisDetails: instagramAccount.ai_analysis_details,
        rawJson: instagramAccount.raw_json
      } : null
    });
  }
  return res.status(httpStatus.CREATED).send({
    messages: [sanitizeMessage(userMessage)],
    instagramAccount: instagramAccount ? {
      id: instagramAccount.id,
      igUserId: instagramAccount.ig_user_id,
      username: instagramAccount.username,
      name: instagramAccount.name,
      biography: instagramAccount.biography,
      website: instagramAccount.website,
      followersCount: instagramAccount.followers_count,
      followsCount: instagramAccount.follows_count,
      mediaCount: instagramAccount.media_count,
      accountType: instagramAccount.account_type,
      isVerified: instagramAccount.is_verified,
      igId: instagramAccount.ig_id,
      audienceGenderAge: instagramAccount.audience_gender_age,
      audienceCountry: instagramAccount.audience_country,
      audienceCity: instagramAccount.audience_city,
      audienceLocale: instagramAccount.audience_locale,
      insights: instagramAccount.insights,
      mentions: instagramAccount.mentions,
      media: instagramAccount.media,
              fetchedAt: instagramAccount.fetched_at,
        hasDetailedAccess: !!(instagramAccount.insights || instagramAccount.media || instagramAccount.audience_gender_age),
        totalLikesCount: instagramAccount.media ? 
          instagramAccount.media.reduce((sum, post) => sum + (post.like_count || 0), 0) : null,
        totalCommentsCount: instagramAccount.media ? 
          instagramAccount.media.reduce((sum, post) => sum + (post.comments_count || 0), 0) : null,
        lastPostDate: instagramAccount.media && instagramAccount.media.length > 0 ? 
          instagramAccount.media
            .filter(post => post.timestamp)
            .map(post => new Date(post.timestamp))
            .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() : null,
        aiAnalysisScore: instagramAccount.ai_analysis_score,
        aiAnalysisDetails: instagramAccount.ai_analysis_details,
        rawJson: instagramAccount.raw_json
      } : null
    });
});

const getMessages = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const { data: chat, error: chatError } = await supabaseAdmin
    .from('chats')
    .select('user_id, instagram_username')
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
  let instagramAccounts = [];
  const instagramUsernames = new Set();
  if (chat.instagram_username) {
    instagramUsernames.add(chat.instagram_username);
  }
  if (messages) {
    for (const message of messages) {
      const extractedUsername = extractInstagramUsername(message.content);
      if (extractedUsername) {
        instagramUsernames.add(extractedUsername.username);
      }
    }
  }
  for (const username of instagramUsernames) {
    const { data: igAccount } = await supabaseAdmin
      .from('instagram_accounts')
      .select('*')
      .eq('username', username)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();
    console.log(`Instagram account found for ${username}:`, igAccount ? 'YES' : 'NO');
    if (igAccount) {
      console.log(`Instagram account details for ${username}:`, { 
        id: igAccount.id, 
        username: igAccount.username, 
        name: igAccount.name,
        followers_count: igAccount.followers_count 
      });
      const formattedAccount = {
        id: igAccount.id,
        igUserId: igAccount.ig_user_id,
        username: igAccount.username,
        name: igAccount.name,
        biography: igAccount.biography,
        website: igAccount.website,
        followersCount: igAccount.followers_count,
        followsCount: igAccount.follows_count,
        mediaCount: igAccount.media_count,
        accountType: igAccount.account_type,
        isVerified: igAccount.is_verified,
        igId: igAccount.ig_id,
        audienceGenderAge: igAccount.audience_gender_age,
        audienceCountry: igAccount.audience_country,
        audienceCity: igAccount.audience_city,
        audienceLocale: igAccount.audience_locale,
        insights: igAccount.insights,
        mentions: igAccount.mentions,
        media: igAccount.media,
        fetchedAt: igAccount.fetched_at,
        hasDetailedAccess: !!(igAccount.insights || igAccount.media || igAccount.audience_gender_age),
        totalLikesCount: igAccount.media ? 
          igAccount.media.reduce((sum, post) => sum + (post.like_count || 0), 0) : null,
        totalCommentsCount: igAccount.media ? 
          igAccount.media.reduce((sum, post) => sum + (post.comments_count || 0), 0) : null,
        lastPostDate: igAccount.media && igAccount.media.length > 0 ? 
          igAccount.media
            .filter(post => post.timestamp)
            .map(post => new Date(post.timestamp))
            .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() : null,
        aiAnalysisScore: igAccount.ai_analysis_score,
        aiAnalysisDetails: igAccount.ai_analysis_details,
        rawJson: igAccount.raw_json
      };
      instagramAccounts.push(formattedAccount);
    }
  }

  const instagramTriggers = [];
  if (messages) {
    for (const message of messages) {
      const extracted = extractInstagramUsername(message.content);
      if (extracted && extracted.username) {
        const account = instagramAccounts.find(acc => acc.username === extracted.username);
        if (account) {
          instagramTriggers.push({
            messageId: message.id,
            username: extracted.username,
            account
          });
        }
      }
    }
  }

  res.send({
    messages: messages.map(sanitizeMessage),
    instagramAccounts,
    instagramAccount: instagramAccounts.length > 0 ? instagramAccounts[instagramAccounts.length - 1] : null, // Keep backward compatibility
    instagramTriggers,
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
      const account = await handleInstagramData(instagramUsername.username, msg.user_id, instagramUsername.forceLive);
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

const getAllMessages = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  const { page = 1, limit = 50, user_id, time_filter, start_date, end_date, feedback } = req.query;
  const offset = (page - 1) * limit;
  
  let query = supabaseAdmin
    .from('messages')
    .select('*, chats(id, name, user_id)', { count: 'exact' });
  
  // Build chat ID filters for main query
  let mainChatIdFilters = [];
  
  // Apply user filter if provided
  if (user_id) {
    // Get chat IDs for the specific user
    const { data: userChatIds, error: userChatIdsError } = await supabaseAdmin
      .from('chats')
      .select('id')
      .eq('user_id', user_id);
    
    if (userChatIdsError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get user chat IDs');
    }
    
    if (userChatIds && userChatIds.length > 0) {
      mainChatIdFilters.push(userChatIds.map(chat => chat.id));
    } else {
      // If user has no chats, return empty result
      return res.send({
        messages: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0,
        },
        totalUserMessages: 0,
        totalAssistantMessages: 0,
      });
    }
  }
  
  // Apply feedback filter if provided
  if (feedback) {
    console.log('=== FEEDBACK FILTER DEBUG ===');
    console.log('Filtering by feedback:', feedback);
    
    // Get chat IDs that contain messages with the specified feedback
    const { data: chatIdsWithFeedback, error: chatIdsError } = await supabaseAdmin
      .from('messages')
      .select('chat_id, feedback')
      .eq('feedback', feedback);
    
    console.log('Chat IDs with feedback query result:', { chatIdsWithFeedback, chatIdsError });
    
    if (chatIdsError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get chat IDs with feedback');
    }
    
    if (chatIdsWithFeedback && chatIdsWithFeedback.length > 0) {
      console.log('Found chat IDs with feedback:', chatIdsWithFeedback.map(msg => msg.chat_id));
      mainChatIdFilters.push(chatIdsWithFeedback.map(msg => msg.chat_id));
    } else {
      console.log('No chats found with feedback:', feedback);
      // If no chats have the specified feedback, return empty result
      return res.send({
        messages: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0,
        },
        totalUserMessages: 0,
        totalAssistantMessages: 0,
      });
    }
  }
  
  // Apply chat ID filters to main query
  if (mainChatIdFilters.length > 0) {
    // If we have multiple filters, find the intersection
    const allChatIds = mainChatIdFilters.flat();
    const uniqueChatIds = [...new Set(allChatIds)];
    
    // If we have both user_id and feedback filters, find intersection
    if (user_id && feedback && mainChatIdFilters.length === 2) {
      const userChatIds = mainChatIdFilters[0];
      const feedbackChatIds = mainChatIdFilters[1];
      const intersectionChatIds = userChatIds.filter(id => feedbackChatIds.includes(id));
      
      if (intersectionChatIds.length > 0) {
        query = query.in('chat_id', intersectionChatIds);
      } else {
        // No intersection, return empty result
        return res.send({
          messages: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
          totalUserMessages: 0,
          totalAssistantMessages: 0,
        });
      }
    } else {
      // Single filter or no intersection needed
      query = query.in('chat_id', uniqueChatIds);
    }
  }
  
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
  
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data: messages, count, error } = await query;
  
  // Debug: Log feedback values in messages
  if (messages && messages.length > 0) {
    console.log('=== MESSAGES DEBUG ===');
    console.log('First few messages feedback values:', messages.slice(0, 5).map(m => ({ 
      id: m.id, 
      feedback: m.feedback, 
      chat_id: m.chat_id,
      sender: m.sender 
    })));
    console.log('=====================');
  }
  
  if (error) {
    // Handle range error gracefully - return empty result if offset is beyond data
    if (error.message.includes('range not satisfiable') || error.message.includes('Requested range not satisfiable')) {
      return res.send({
        messages: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0,
        },
        totalUserMessages: 0,
        totalAssistantMessages: 0,
      });
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  
  // Create separate queries for analytics (same filters as main query)
  let userQuery = supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'user');
  let assistantQuery = supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'assistant');
  
  // Build chat ID filters for analytics
  let chatIdFilters = [];
  
  if (user_id) {
    // Get chat IDs for the specific user
    const { data: userChatIds, error: userChatIdsError } = await supabaseAdmin
      .from('chats')
      .select('id')
      .eq('user_id', user_id);
    
    if (userChatIdsError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get user chat IDs for analytics');
    }
    
    if (userChatIds && userChatIds.length > 0) {
      chatIdFilters.push(userChatIds.map(chat => chat.id));
    } else {
      // If user has no chats, set counts to 0
      userQuery = supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'user').eq('chat_id', 'non-existent-id');
      assistantQuery = supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'assistant').eq('chat_id', 'non-existent-id');
    }
  }
  
  if (feedback) {
    // Get chat IDs that contain messages with the specified feedback
    const { data: chatIdsWithFeedback, error: chatIdsError } = await supabaseAdmin
      .from('messages')
      .select('chat_id')
      .eq('feedback', feedback);
    
    if (chatIdsError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get chat IDs with feedback for analytics');
    }
    
    if (chatIdsWithFeedback && chatIdsWithFeedback.length > 0) {
      chatIdFilters.push(chatIdsWithFeedback.map(msg => msg.chat_id));
    } else {
      // If no chats have the specified feedback, set counts to 0
      userQuery = supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'user').eq('chat_id', 'non-existent-id');
      assistantQuery = supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'assistant').eq('chat_id', 'non-existent-id');
    }
  }
  
  // Apply chat ID filters to analytics queries
  if (chatIdFilters.length > 0) {
    // If we have multiple filters, find the intersection
    const allChatIds = chatIdFilters.flat();
    const uniqueChatIds = [...new Set(allChatIds)];
    
    // If we have both user_id and feedback filters, find intersection
    if (user_id && feedback && chatIdFilters.length === 2) {
      const userChatIds = chatIdFilters[0];
      const feedbackChatIds = chatIdFilters[1];
      const intersectionChatIds = userChatIds.filter(id => feedbackChatIds.includes(id));
      
      if (intersectionChatIds.length > 0) {
        userQuery = userQuery.in('chat_id', intersectionChatIds);
        assistantQuery = assistantQuery.in('chat_id', intersectionChatIds);
      } else {
        // No intersection, set counts to 0
        userQuery = supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'user').eq('chat_id', 'non-existent-id');
        assistantQuery = supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'assistant').eq('chat_id', 'non-existent-id');
      }
    } else {
      // Single filter or no intersection needed
      userQuery = userQuery.in('chat_id', uniqueChatIds);
      assistantQuery = assistantQuery.in('chat_id', uniqueChatIds);
    }
  }
  
  // Apply same time filtering to analytics
  if (time_filter === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    userQuery = userQuery.gte('created_at', todayStart).lt('created_at', todayEnd);
    assistantQuery = assistantQuery.gte('created_at', todayStart).lt('created_at', todayEnd);
  } else if (time_filter === 'last_week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    userQuery = userQuery.gte('created_at', weekAgo);
    assistantQuery = assistantQuery.gte('created_at', weekAgo);
  } else if (time_filter === 'last_month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    userQuery = userQuery.gte('created_at', monthAgo);
    assistantQuery = assistantQuery.gte('created_at', monthAgo);
  } else if (time_filter === 'custom' && start_date && end_date) {
    const startDateTime = new Date(start_date).toISOString();
    const endDateTime = new Date(new Date(end_date).getTime() + 24 * 60 * 60 * 1000).toISOString();
    userQuery = userQuery.gte('created_at', startDateTime).lt('created_at', endDateTime);
    assistantQuery = assistantQuery.gte('created_at', startDateTime).lt('created_at', endDateTime);
  } else if (start_date && !end_date) {
    userQuery = userQuery.gte('created_at', new Date(start_date).toISOString());
    assistantQuery = assistantQuery.gte('created_at', new Date(start_date).toISOString());
  } else if (end_date && !start_date) {
    const endDateTime = new Date(new Date(end_date).getTime() + 24 * 60 * 60 * 1000).toISOString();
    userQuery = userQuery.lt('created_at', endDateTime);
    assistantQuery = assistantQuery.lt('created_at', endDateTime);
  }
  
  const { count: userCount, error: userCountError } = await userQuery;
  const { count: assistantCount, error: assistantCountError } = await assistantQuery;
    
  if (userCountError || assistantCountError) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to count user/assistant messages');
  }
  
  res.send({
    messages: messages.map(sanitizeMessage),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
    totalUserMessages: userCount ?? 0,
    totalAssistantMessages: assistantCount ?? 0,
  });
});

/**
 * Generate enhanced DM variations
 */
const generateEnhancedDM = catchAsync(async (req, res) => {
  const { message_id } = req.params;
  
  if (!message_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Message ID is required');
  }

  // Get the original message
  const { data: message, error: messageError } = await supabaseAdmin
    .from('messages')
    .select('*, chats(name, profession, product, user_id)')
    .eq('id', message_id)
    .single();

  if (messageError || !message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  // Check if user has access to this message
  if (req.user.role !== 'admin' && message.chats.user_id !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  // Only allow enhancement of assistant messages that are DMs
  if (message.sender !== 'assistant') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only assistant messages can be enhanced');
  }

  // Get user details for volunteer name
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('name')
    .eq('id', message.chats.user_id)
    .single();

  const volunteerName = userData?.name || 'Smart Spidy Team';
  const chatName = message.chats.name;
  const profession = message.chats.profession || 'general';
  const campaign = message.chats.product || 'Pads For Freedom';

  try {
    // Generate enhanced variations
    const variations = await generateEnhancedDMVariations(
      message.content,
      profession,
      campaign,
      chatName,
      volunteerName
    );

    res.send({
      success: true,
      variations,
      originalMessage: message
    });
  } catch (error) {
    console.error('Error generating enhanced DM:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate enhanced DM variations');
  }
});

module.exports = {
  createMessage,
  getMessages,
  getMessage,
  updateMessage,
  deleteMessage,
  createMessages,
  getAllMessages,
  generateEnhancedDM,
}; 