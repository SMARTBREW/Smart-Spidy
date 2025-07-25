const fetch = require('node-fetch');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set. Please add it to your environment.');
}

async function generateOpenAIResponse(userMessage) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are Smart Spidy, a helpful assistant.' },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 256,
    temperature: 0.7
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Analyze Instagram account using AI and provide a comprehensive score
 * @param {Object} instagramData - Complete Instagram account data
 * @returns {Object} - AI analysis with score and detailed insights
 */
async function analyzeInstagramAccount(instagramData) {
  try {
    // Prepare account data for analysis
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
      
      // Engagement metrics (if available)
      totalLikes: instagramData.media ? 
        instagramData.media.reduce((sum, post) => sum + (post.like_count || 0), 0) : 0,
      totalComments: instagramData.media ? 
        instagramData.media.reduce((sum, post) => sum + (post.comments_count || 0), 0) : 0,
      avgLikesPerPost: instagramData.media && instagramData.media.length > 0 ? 
        instagramData.media.reduce((sum, post) => sum + (post.like_count || 0), 0) / instagramData.media.length : 0,
      avgCommentsPerPost: instagramData.media && instagramData.media.length > 0 ? 
        instagramData.media.reduce((sum, post) => sum + (post.comments_count || 0), 0) / instagramData.media.length : 0,
      
      // Content analysis
      recentPostCount: instagramData.media ? instagramData.media.length : 0,
      hasRecentActivity: instagramData.media && instagramData.media.length > 0 ? 
        new Date(instagramData.media[0].timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : false,
      
      // Profile completeness
      hasCompleteBio: !!instagramData.biography && instagramData.biography.length > 10,
      hasDisplayName: !!instagramData.name && instagramData.name !== instagramData.username,
    };

    // Calculate engagement rate
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

Consider factors like:
- Follower-to-following ratio
- Engagement rate and quality
- Profile completeness and professionalism
- Content consistency
- Business potential
- Brand appeal
- Audience size and quality

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

    const response = await generateOpenAIResponse(analysisPrompt); // Changed from openai.chat.completions.create to generateOpenAIResponse

    const aiResponse = response;
    
    if (!aiResponse) {
      throw new Error('No response from AI analysis');
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Remove markdown code block markers if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      analysisResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI analysis response:', aiResponse);
      // Fallback analysis
      analysisResult = {
        score: 50,
        category: 'Unknown',
        strengths: ['Profile exists'],
        weaknesses: ['Analysis incomplete'],
        recommendations: ['Complete profile setup'],
        analysis: 'AI analysis failed to complete properly'
      };
    }

    // Validate and clamp score
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
    
    // Return a basic fallback score based on simple metrics
    const followers = instagramData.followers_count || 0;
    const hasVerification = instagramData.is_verified ? 20 : 0;
    const hasBio = instagramData.biography ? 15 : 0;
    const hasWebsite = instagramData.website ? 10 : 0;
    const followerScore = Math.min(50, followers / 10000); // Up to 50 points for followers
    
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

module.exports = { generateOpenAIResponse, analyzeInstagramAccount }; 