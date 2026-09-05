const fetch = require('node-fetch');
const { supabaseAdmin } = require('../config/supabase');
const { mapProductToCampaign, normalizeCampaignName } = require('../utils/campaignMapper');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!OPENAI_API_KEY && !MISTRAL_API_KEY) {
  throw new Error('Neither OPENAI_API_KEY nor MISTRAL_API_KEY environment variable is set. Please add an API key.');
}

const boldMap = {
  'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
  'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
  '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗',
  ' ': ' '
};

function convertMarkdownBoldToUnicode(text) {
  if (!text) return text;
  return text.replace(/\*\*(.*?)\*\*/g, (match, captured) => {
    return captured.split('').map(char => boldMap[char] || char).join('');
  });
}

/**
 * Universal chat completion helper supporting Mistral & OpenAI
 */
async function callChatCompletion({ messages, max_tokens = 500, temperature = 0.7, jsonMode = false }) {
  const preferredProvider = (process.env.AI_PROVIDER || (process.env.MISTRAL_API_KEY ? 'mistral' : 'openai')).toLowerCase();
  const mistralKey = process.env.MISTRAL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const tryMistral = async () => {
    if (!mistralKey) throw new Error('MISTRAL_API_KEY is not set');
    const modelsToTry = ['open-mistral-nemo', 'ministral-8b-latest', 'open-mistral-7b'];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const body = {
          model,
          messages,
          max_tokens,
          temperature,
        };
        if (jsonMode) {
          body.response_format = { type: 'json_object' };
        }

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mistralKey}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mistral API error (${response.status} on ${model}): ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || '';
        if (content) {
          return content;
        }
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ Mistral model ${model} failed (${err.message}), trying next model...`);
      }
    }

    throw lastError || new Error('All Mistral models failed');
  };

  const tryOpenAI = async () => {
    if (!openaiKey) throw new Error('OPENAI_API_KEY is not set');
    const body = {
      model: 'gpt-4o',
      messages,
      max_tokens,
      temperature,
    };
    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  };

  if (preferredProvider === 'mistral') {
    try {
      return await tryMistral();
    } catch (mistralErr) {
      console.warn('⚠️ Mistral chat completion failed, attempting OpenAI fallback:', mistralErr.message);
      if (openaiKey) {
        return await tryOpenAI();
      }
      throw mistralErr;
    }
  } else {
    try {
      return await tryOpenAI();
    } catch (openaiErr) {
      console.warn('⚠️ OpenAI chat completion failed, attempting Mistral fallback:', openaiErr.message);
      if (mistralKey) {
        return await tryMistral();
      }
      throw openaiErr;
    }
  }
}

/**
 * Generate embedding for text using OpenAI (returns null if unavailable)
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]|null>} - Embedding vector or null
 */
async function generateEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`OpenAI Embedding API error (${response.status}): ${errText}`);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    console.warn('Error generating embedding:', error.message);
    return null;
  }
}

/**
 * Test if campaign data exists in the database
 * @param {string} campaign - Campaign name to test
 * @returns {Object} - Diagnostic information
 */
async function testCampaignData(campaign) {
  try {
    console.log('=== Testing Campaign Data START ===');
    console.log('Testing campaign:', campaign);
    
    const { data: allData, error: allError } = await supabaseAdmin
      .from('smartspidy')
      .select('id, campaign, combined_text')
      .eq('campaign', campaign)
      .limit(5);

    if (allError) {
      console.error('❌ Error querying campaign data:', allError);
      return { exists: false, error: allError };
    }

    console.log('✅ Found', allData?.length || 0, 'records for campaign:', campaign);
    return { exists: (allData && allData.length > 0), count: allData?.length || 0, sample: allData };
  } catch (error) {
    console.error('❌ Error testing campaign data:', error);
    return { exists: false, error };
  }
}

/**
 * Get campaign-specific context from the knowledge base.
 * Searches via vector embeddings if available; otherwise falls back to direct campaign knowledge records.
 * @param {string} query - User query
 * @param {string} campaign - Campaign name
 * @returns {Promise<string>} - Relevant context
 */
async function getCampaignContext(query, campaign) {
  try {
    console.log('=== getCampaignContext START ===');
    console.log('Query:', query);
    console.log('Campaign:', campaign);
    
    const normalizedCampaign = normalizeCampaignName(campaign);

    // 1. Try vector similarity search if embeddings work
    let queryEmbedding = null;
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (e) {
      console.warn('Embedding generation skipped:', e.message);
    }

    if (queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
      console.log('🔍 Calling search_campaign_embeddings RPC...');
      const { data, error } = await supabaseAdmin.rpc('search_campaign_embeddings', {
        query_embedding: queryEmbedding,
        campaign_name: normalizedCampaign,
        match_threshold: 0.4,
        match_count: 5
      });

      if (!error && data && data.length > 0) {
        console.log('✅ Found campaign context via vector search, items:', data.length);
        return data.map(item => item.combined_text).filter(Boolean).join('\n---\n');
      }
    }

    // 2. Fallback: Retrieve campaign knowledge records directly from smartspidy table
    console.log('📚 Fetching direct campaign context for:', normalizedCampaign);
    const { data: directData, error: directError } = await supabaseAdmin
      .from('smartspidy')
      .select('combined_text')
      .ilike('campaign', `%${normalizedCampaign}%`)
      .limit(5);

    if (!directError && directData && directData.length > 0) {
      console.log(`✅ Loaded ${directData.length} records directly for campaign ${normalizedCampaign}`);
      return directData.map(item => item.combined_text).filter(Boolean).join('\n---\n');
    }

    // Exact match fallback
    const { data: rawData } = await supabaseAdmin
      .from('smartspidy')
      .select('combined_text')
      .eq('campaign', campaign)
      .limit(5);

    if (rawData && rawData.length > 0) {
      return rawData.map(item => item.combined_text).filter(Boolean).join('\n---\n');
    }

    return '';
  } catch (error) {
    console.error('Error getting campaign context:', error);
    return '';
  }
}

/**
 * Generate AI Response (supports Mistral and OpenAI)
 */
async function generateOpenAIResponse(userMessage, chatDetails = null, conversationHistory = []) {
  try {
    console.log('=== AI Response Generation START ===');
    console.log('User message:', userMessage);
    console.log('Chat details:', JSON.stringify(chatDetails, null, 2));
    
    // Build conversation memory context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-10);
      conversationContext = recentMessages.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
    }
    
    let systemPrompt = `You are Smart Spidy, a helpful assistant specializing in social impact campaigns.

CONVERSATION MEMORY INSTRUCTIONS:
- Remember and reference previous conversations within this chat session
- Use conversation history to provide contextual and personalized responses
- If the user mentioned something earlier in the conversation, acknowledge it
- Don't repeat information that was already discussed unless specifically asked
- Build upon previous conversations to create continuity

IMPORTANT FORMATTING INSTRUCTIONS:
- When emphasizing important words or phrases, use Unicode bold characters directly
- Use 𝐔𝐧𝐢𝐜𝐨𝐝𝐞 𝐛𝐨𝐥𝐝 𝐜𝐡𝐚𝐫𝐚𝐜𝐭𝐞𝐫𝐬 for natural emphasis on key terms, concepts, or important information
- Do NOT use markdown **bold** or *italic* formatting at all
- Do NOT use "quotes" for emphasis
- Apply Unicode bold to words that deserve emphasis based on context and importance
- Do not hardcode specific words - let the context guide what should be emphasized
- IMPORTANT: Never use ** or * for formatting - only use Unicode bold characters directly

${conversationContext ? `CONVERSATION HISTORY:
${conversationContext}

Use this conversation history to provide contextual responses and remember what has been discussed.

` : ''}`;

    let contextualMessage = userMessage;

    let context = '';
    let campaign = '';
    if (chatDetails && chatDetails.product) {
      campaign = mapProductToCampaign(chatDetails.product);
      context = await getCampaignContext(userMessage, campaign);

      if (context) {
        systemPrompt += `Campaign Context:
${context}

Use this context to provide accurate, campaign-specific responses. Focus on information relevant to the ${campaign} campaign.`;
        
        contextualMessage = `Based on the ${campaign} campaign context, please answer: ${userMessage}`;
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextualMessage }
    ];

    try {
      const content = await callChatCompletion({
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return convertMarkdownBoldToUnicode(content);
    } catch (llmErr) {
      console.warn('⚠️ All LLM API providers failed, generating intelligent knowledge base response:', llmErr.message);

      const targetName = (chatDetails && chatDetails.name) ? chatDetails.name : 'there';
      const campaignName = campaign || 'Wings Of Hope';

      if (context) {
        const keySnippet = context.split('\n---\n')[0]?.trim();
        return `Hello ${targetName}! Regarding our **${campaignName}** initiative:\n\n${keySnippet}\n\nLet me know if you would like more details on how to get involved or support this cause!`;
      }

      return `Hello ${targetName}! Thank you for reaching out. We are actively working on the **${campaignName}** campaign to create positive social change. How can I assist you with this campaign today?`;
    }
  } catch (error) {
    console.error('Error in generateOpenAIResponse:', error);
    throw error;
  }
}

/**
 * Analyze Instagram account using AI and provide a comprehensive score
 * @param {Object} instagramData - Complete Instagram account data
 * @returns {Object} - AI analysis with score and detailed insights
 */
async function analyzeInstagramAccount(instagramData) {
  try {
    const accountSummary = {
      username: instagramData.username,
      name: instagramData.name,
      biography: instagramData.biography,
      website: instagramData.website,
      followersCount: instagramData.followers_count,
      followsCount: instagramData.follows_count,
      mediaCount: instagramData.media_count,
      accountType: instagramData.account_type,
      isVerified: instagramData.is_verified,
      hasWebsite: !!instagramData.website,
      
      totalLikes: instagramData.media ? 
        instagramData.media.reduce((sum, post) => sum + (post.like_count || 0), 0) : 0,
      totalComments: instagramData.media ? 
        instagramData.media.reduce((sum, post) => sum + (post.comments_count || 0), 0) : 0,
      avgLikesPerPost: instagramData.media && instagramData.media.length > 0 ? 
        instagramData.media.reduce((sum, post) => sum + (post.like_count || 0), 0) / instagramData.media.length : 0,
      avgCommentsPerPost: instagramData.media && instagramData.media.length > 0 ? 
        instagramData.media.reduce((sum, post) => sum + (post.comments_count || 0), 0) / instagramData.media.length : 0,
      
      recentPostCount: instagramData.media ? instagramData.media.length : 0,
      hasRecentActivity: instagramData.media && instagramData.media.length > 0 ? 
        new Date(instagramData.media[0].timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : false,
      
      hasCompleteBio: !!instagramData.biography && instagramData.biography.length > 10,
      hasDisplayName: !!instagramData.name && instagramData.name !== instagramData.username,
    };

    const engagementRate = accountSummary.followersCount > 0 ? 
      ((accountSummary.avgLikesPerPost + accountSummary.avgCommentsPerPost) / accountSummary.followersCount) * 100 : 0;

    const analysisPrompt = `Analyze this Instagram account and provide a comprehensive business/influencer score from 0-100.

Account Data:
- Username: ${accountSummary.username}
- Display Name: ${accountSummary.name || 'Not set'}
- Biography: ${accountSummary.biography || 'No bio'}
- Website: ${accountSummary.website || 'No website'}
- Account Type: ${accountSummary.accountType}
- Verified: ${accountSummary.isVerified ? 'Yes' : 'No'}

Metrics:
- Followers: ${accountSummary.followersCount?.toLocaleString() || 0}
- Following: ${accountSummary.followsCount?.toLocaleString() || 0}
- Total Posts: ${accountSummary.mediaCount || 0}
- Recent Posts Analyzed: ${accountSummary.recentPostCount}

Engagement:
- Total Likes: ${accountSummary.totalLikes?.toLocaleString() || 0}
- Total Comments: ${accountSummary.totalComments?.toLocaleString() || 0}
- Avg Likes/Post: ${Math.round(accountSummary.avgLikesPerPost || 0)}
- Avg Comments/Post: ${Math.round(accountSummary.avgCommentsPerPost || 0)}
- Engagement Rate: ${engagementRate.toFixed(3)}%

Profile Quality:
- Complete Bio: ${accountSummary.hasCompleteBio ? 'Yes' : 'No'}
- Display Name Set: ${accountSummary.hasDisplayName ? 'Yes' : 'No'}
- Has Website: ${accountSummary.hasWebsite ? 'Yes' : 'No'}
- Recent Activity: ${accountSummary.hasRecentActivity ? 'Yes' : 'No'}

Please analyze this account and provide:
1. Overall Score (0-100): Based on profile quality, engagement, follower count, content strategy, and business potential
2. Strengths: Top 3-5 strengths of this account
3. Weaknesses: Top 3-5 areas for improvement
4. Recommendations: Specific actionable advice to improve the score
5. Category: What type of account this is (Personal Brand, Business, Influencer, Celebrity, etc.)

Respond in JSON format:
{
  "score": 85,
  "category": "Business",
  "strengths": ["High engagement rate", "Professional bio", "Verified account"],
  "weaknesses": ["Low posting frequency", "No website link"],
  "recommendations": ["Post more consistently", "Add website link", "Improve bio"],
  "analysis": "Brief overall analysis summary"
}

IMPORTANT: Respond with ONLY the JSON object, no markdown formatting, no code blocks, no additional text.`;

    const aiResponse = await callChatCompletion({
      messages: [
        { role: 'system', content: 'You are an Instagram analytics expert that outputs strictly valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      max_tokens: 600,
      temperature: 0.3,
      jsonMode: true
    });

    if (!aiResponse) {
      throw new Error('No response from AI analysis');
    }

    let analysisResult;
    try {
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      analysisResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI analysis response:', aiResponse);
      analysisResult = {
        score: 50,
        category: 'Unknown',
        strengths: ['Profile exists'],
        weaknesses: ['Analysis incomplete'],
        recommendations: ['Complete profile setup'],
        analysis: 'AI analysis completed with default metrics'
      };
    }

    const finalScore = Math.max(0, Math.min(100, analysisResult.score || 50));

    return {
      score: finalScore,
      details: {
        category: analysisResult.category || 'Unknown',
        strengths: analysisResult.strengths || [],
        weaknesses: analysisResult.weaknesses || [],
        recommendations: analysisResult.recommendations || [],
        analysis: analysisResult.analysis || 'No analysis available',
        metrics: accountSummary,
        engagementRate: parseFloat(engagementRate.toFixed(3)),
        analyzedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error in AI Instagram analysis:', error);
    const followers = instagramData.followers_count || 0;
    const hasVerification = instagramData.is_verified ? 20 : 0;
    const hasBio = instagramData.biography ? 15 : 0;
    const hasWebsite = instagramData.website ? 10 : 0;
    const followerScore = Math.min(50, followers / 10000);
    const fallbackScore = Math.round(hasVerification + hasBio + hasWebsite + followerScore);

    return {
      score: fallbackScore,
      details: {
        category: 'Unknown',
        strengths: ['Basic profile setup'],
        weaknesses: ['AI analysis unavailable'],
        recommendations: ['Complete profile optimization'],
        analysis: 'Fallback analysis - AI service unavailable',
        metrics: { followers },
        engagementRate: 0,
        analyzedAt: new Date().toISOString(),
        error: error.message
      }
    };
  }
}

/**
 * Extract potential slogans or taglines from DM content
 */
function extractSloganFromDM(dmContent) {
  const sloganPatterns = [
    /"([^"]+)"/g,
    /#([A-Za-z0-9_]+)/g,
    /['']([^'']+)['']/g,
    /campaign\s*[-:]\s*["']?([^"'\n.!?]+)["']?/gi,
    /slogan\s*[-:]\s*["']?([^"'\n.!?]+)["']?/gi,
  ];
  
  const potentialSlogans = [];
  for (const pattern of sloganPatterns) {
    let match;
    while ((match = pattern.exec(dmContent)) !== null) {
      const slogan = match[1]?.trim();
      if (slogan && slogan.length > 5 && slogan.length < 100) {
        potentialSlogans.push(slogan);
      }
    }
  }
  
  if (potentialSlogans.length > 0) {
    return potentialSlogans.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  return null;
}

/**
 * Generate enhanced DM variations with different word lengths
 */
async function generateEnhancedDMVariations(originalDM, profession, campaign, chatName, volunteerName) {
  try {
    console.log('=== Generating Enhanced DM Variations ===');
    console.log('Original DM length:', originalDM.length);
    console.log('Profession:', profession);
    console.log('Campaign:', campaign);
    
    const extractedSlogan = extractSloganFromDM(originalDM);
    
    const sloganInstructions = extractedSlogan 
      ? `IMPORTANT SLOGAN REQUIREMENT:
- The original DM contains this slogan/tagline: "${extractedSlogan}"
- You MUST include this exact slogan in each enhanced variation
- Place the slogan strategically where it fits naturally in the message
- The slogan should be emphasized using 𝐛𝐨𝐥𝐝 text formatting

`
      : '';
    
    const systemPrompt = `You are an expert copywriter specializing in professional social impact campaigns. Your task is to enhance and create variations of a Direct Message (DM) for Instagram outreach campaigns.

ORIGINAL DM:
${originalDM}

TARGET INFORMATION:
- Profession: ${profession}
- Campaign: ${campaign}
- Target Name: ${chatName}
- Volunteer Name: ${volunteerName}

${sloganInstructions}INSTRUCTIONS:
1. Create THREE enhanced versions of this DM with different word counts
2. Each version should be MORE FORMAL, CLEAN, and EFFECTIVE than the original
3. Use proper paragraph structure - NOT single paragraphs
4. Maintain the core message and call-to-action
5. Use 𝐔𝐧𝐢𝐜𝐨𝐝𝐞 𝐛𝐨𝐥𝐝 𝐜𝐡𝐚𝐫𝐚𝐜𝐭𝐞𝐫𝐬 for emphasis on key terms
6. Do NOT use markdown formatting
7. Make each version feel professional and business-like
8. Use proper greeting and closing formats
9. ${extractedSlogan ? 'PRESERVE the original slogan exactly as provided above' : 'Maintain any campaign messaging or taglines from the original'}

FORMATTING REQUIREMENTS:
- Use proper paragraph breaks with double line spacing
- Start with a professional greeting
- Include clear introduction, body, and conclusion
- End with a professional closing and call-to-action
- Use 𝐛𝐨𝐥𝐝 𝐭𝐞𝐱𝐭 for emphasis on important words
${extractedSlogan ? '- Include the slogan prominently in each variation' : ''}

WORD COUNT REQUIREMENTS:
- Small (150 words): 2-3 paragraphs, concise but professional
- Medium (200 words): 3-4 paragraphs, balanced and engaging
- Large (250 words): 4-5 paragraphs, comprehensive and detailed

Return ONLY a JSON object with this exact structure:
{
  "small": "150-word version with proper paragraphs",
  "medium": "200-word version with proper paragraphs", 
  "large": "250-word version with proper paragraphs"
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate the three enhanced DM variations as specified with proper paragraph structure.' }
    ];

    const content = await callChatCompletion({
      messages,
      max_tokens: 1200,
      temperature: 0.7,
      jsonMode: true
    });

    try {
      let clean = content.trim();
      if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const variations = JSON.parse(clean);
      if (!variations.small || !variations.medium || !variations.large) {
        throw new Error('Invalid response structure');
      }
      
      console.log('Enhanced DM variations generated successfully');
      return variations;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        small: `Dear ${chatName},

I hope this message finds you well. I'm ${volunteerName}, reaching out on behalf of our ${campaign} campaign. As a respected ${profession}, your expertise and influence could make a 𝐬𝐢𝐠𝐧𝐢𝐟𝐢𝐜𝐚𝐧𝐭 𝐢𝐦𝐩𝐚𝐜𝐭 on this important cause.

We would be honored to have you join us as a campaign ambassador. Your voice could help 𝐬𝐩𝐫𝐞𝐚𝐝 𝐚𝐰𝐚𝐫𝐞𝐧𝐞𝐬𝐬 and 𝐜𝐫𝐞𝐚𝐭𝐞 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐜𝐡𝐚𝐧𝐠𝐞 in our community.

Would you be interested in learning more about how you can contribute to this meaningful initiative?

Best regards,
${volunteerName}`,

        medium: `Dear ${chatName},

I hope this message finds you well. I'm ${volunteerName}, and I'm reaching out regarding our ${campaign} campaign. Your professional standing as a ${profession} and your commitment to community impact make you an ideal candidate for this initiative.

Our campaign focuses on 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐜𝐡𝐚𝐧𝐠𝐞 and 𝐛𝐮𝐢𝐥𝐝𝐢𝐧𝐠 𝐚 𝐛𝐞𝐭𝐭𝐞𝐫 𝐟𝐮𝐭𝐮𝐫𝐞 for our community. We believe that your expertise and influence could significantly amplify our message and reach.

As a campaign ambassador, you would have the opportunity to 𝐥𝐞𝐚𝐝 𝐛𝐲 𝐞𝐱𝐚𝐦𝐩𝐥𝐞 and 𝐢𝐧𝐬𝐩𝐢𝐫𝐞 𝐨𝐭𝐡𝐞𝐫𝐬 to join this meaningful cause. Your professional network and credibility would be invaluable assets to our mission.

I would love to discuss this opportunity with you in more detail. Would you be available for a brief conversation about how you can contribute to this important initiative?

Best regards,
${volunteerName}`,

        large: `Dear ${chatName},

I hope this message finds you well. I'm ${volunteerName}, and I'm reaching out regarding our ${campaign} campaign. Your distinguished career as a ${profession} and your demonstrated commitment to community service make you an exceptional candidate for this meaningful initiative.

Our campaign represents a 𝐜𝐨𝐦𝐩𝐫𝐞𝐡𝐞𝐧𝐬𝐢𝐯𝐞 𝐞𝐟𝐟𝐨𝐫𝐭 to address critical social issues and 𝐜𝐫𝐞𝐚𝐭𝐞 𝐥𝐚𝐬𝐭𝐢𝐧𝐠 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐜𝐡𝐚𝐧𝐠𝐞 in our community. We believe that your professional expertise, leadership qualities, and established network would be 𝐢𝐧𝐯𝐚𝐥𝐮𝐚𝐛𝐥𝐞 𝐚𝐬𝐬𝐞𝐭𝐬 to our mission.

As a campaign ambassador, you would have the opportunity to 𝐥𝐞𝐚𝐝 𝐛𝐲 𝐞𝐱𝐚𝐦𝐩𝐥𝐞, 𝐢𝐧𝐬𝐩𝐢𝐫𝐞 𝐨𝐭𝐡𝐞𝐫𝐬, and 𝐜𝐨𝐧𝐭𝐫𝐢𝐛𝐮𝐭𝐞 𝐭𝐨 𝐚 𝐜𝐚𝐮𝐬𝐞 that aligns with your values. Your involvement would not only amplify our message but also demonstrate your commitment to social responsibility and community leadership.

We would be honored to have you join our team of dedicated professionals who are working together to 𝐦𝐚𝐤𝐞 𝐚 𝐝𝐢𝐟𝐟𝐞𝐫𝐞𝐧𝐜𝐞. Your participation would be instrumental in achieving our shared goals and creating a lasting impact.

I would welcome the opportunity to discuss this role with you in detail and answer any questions you may have. Would you be available for a brief conversation about how you can contribute to this important initiative?

Best regards,
${volunteerName}`
      };
    }
  } catch (error) {
    console.error('Error generating enhanced DM variations:', error);
    throw error;
  }
}

module.exports = {
  generateOpenAIResponse,
  generateAIResponse: generateOpenAIResponse,
  analyzeInstagramAccount,
  generateEmbedding,
  getCampaignContext,
  testCampaignData,
  generateEnhancedDMVariations,
  callChatCompletion
};
