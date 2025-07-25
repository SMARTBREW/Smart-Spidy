const config = require('../config/config');
const fetch = require('node-fetch');

// Instagram API configuration
const GRAPH_API_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || "EAAXy9R6Gng0BPLLeWI3LMBH6bzKKS4OEijdROjZCaz3bVhogDwv0iroKSQd2GHTMwdemJ3fTk0driBzxWX2M09iysyNHPUyyTqyUtnktzmqX56MiKfQYSOj6rvgeGZAhPAL7BfYdOtO8ft1mp2UvJpnr8YEizYXQ0lwZADG5ps6MWsYZCeDKuhq8uLsP";
const DEFAULT_IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "17841475777137453";

/**
 * Fetch comprehensive Instagram account details using multiple Graph API endpoints
 * @param {string} baseIgUserId - The IG User ID of a business/creator account you manage
 * @param {string} targetUsername - The Instagram username to look up
 */
async function fetchComprehensiveInstagramData(baseIgUserId = DEFAULT_IG_USER_ID, targetUsername) {
  try {
    // Step 1: Get basic profile data using business_discovery (includes media for public accounts)
    const profileData = await fetchBasicProfileData(baseIgUserId, targetUsername);
    
    // Step 2: Try to get detailed data if this is a managed account
    // (This will only work if the account is managed by you)
    let detailedData = null;
    try {
      detailedData = await fetchDetailedAccountData(profileData.ig_id || baseIgUserId);
    } catch (detailedError) {
      console.log('Detailed account data not available (account not managed):', detailedError.message);
    }

    // Step 3: Process media data from business_discovery if available
    let processedMedia = null;
    if (profileData.media && profileData.media.data && profileData.media.data.length > 0) {
      processedMedia = profileData.media.data.map(post => ({
        id: post.id,
        media_type: post.media_type,
        // media_url: post.media_url, // Removed - don't save temporary CDN URLs
        thumbnail_url: post.thumbnail_url,
        permalink: post.permalink, // Keep - permanent Instagram post link
        caption: post.caption,
        timestamp: post.timestamp,
        like_count: post.like_count,
        comments_count: post.comments_count,
        children: post.children ? post.children.data : null
      }));
    }

    // Combine all data
    const comprehensiveData = {
      // Basic profile data (always available for business/creator accounts)
      ...profileData,
      
      // Use processed media from business_discovery or detailed data
      media: processedMedia || (detailedData && detailedData.media) || null,
      
      // Detailed data (only available for managed accounts)
      ...(detailedData || {}),
      
      // Meta information
      fetchedAt: new Date().toISOString(),
      hasDetailedAccess: !!detailedData
    };

    return comprehensiveData;
    
  } catch (error) {
    console.error('Error fetching comprehensive Instagram data:', error);
    throw error;
  }
}

/**
 * Fetch basic profile data using business_discovery (works for any business/creator account)
 */
async function fetchBasicProfileData(baseIgUserId, targetUsername) {
  const fields = [
    'username',
    'name', 
    'biography',
    'website',
    'followers_count',
    'follows_count',
    'media_count',
    'ig_id',
    'media.limit(25){id,media_type,thumbnail_url,permalink,caption,timestamp,like_count,comments_count,children{id,media_type,thumbnail_url}}'
  ].join(',');

  const url = `https://graph.facebook.com/v19.0/${baseIgUserId}?fields=business_discovery.username(${targetUsername}){${fields}}&access_token=${GRAPH_API_TOKEN}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.business_discovery && data.business_discovery.username) {
    return {
      ...data.business_discovery,
      account_type: 'BUSINESS', // Assume business since business_discovery worked
      is_verified: false // Not available via business_discovery
    };
  } else if (data.error) {
    const errorMessage = data.error.message || 'Could not fetch Instagram details.';
    
    if (errorMessage.includes('does not exist') || errorMessage.includes('missing permissions')) {
      throw new Error(`Instagram API Error: The base Instagram account ID (${baseIgUserId}) is invalid or lacks permissions.`);
    } else if (errorMessage.includes('Unsupported get request')) {
      throw new Error(`Instagram API Error: The account ${targetUsername} may not be a business/creator account or is private.`);
    } else if (errorMessage.includes('rate limit')) {
      throw new Error('Instagram API Error: Rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`Instagram API Error: ${errorMessage}`);
    }
  } else {
    throw new Error('Account not found or not a business/creator account.');
  }
}

/**
 * Fetch detailed account data for managed accounts (includes insights, media, etc.)
 */
async function fetchDetailedAccountData(igUserId) {
  try {
    // Fetch profile details with more fields
    const profileDetails = await fetchDetailedProfile(igUserId);
    
    // Fetch audience insights
    const audienceInsights = await fetchAudienceInsights(igUserId);
    
    // Fetch account insights
    const accountInsights = await fetchAccountInsights(igUserId);
    
    // Fetch media with details
    const mediaData = await fetchMediaWithDetails(igUserId);
    
    // Fetch mentions
    const mentions = await fetchMentions(igUserId);

    return {
      ...profileDetails,
      audience_gender_age: audienceInsights.audience_gender_age,
      audience_country: audienceInsights.audience_country,
      audience_city: audienceInsights.audience_city,
      audience_locale: audienceInsights.audience_locale,
      insights: accountInsights,
      media: mediaData,
      mentions: mentions
    };
    
  } catch (error) {
    throw new Error(`Detailed data fetch failed: ${error.message}`);
  }
}

/**
 * Fetch detailed profile information for managed accounts
 */
async function fetchDetailedProfile(igUserId) {
  const fields = [
    'id',
    'username',
    'name',
    'biography',
    'website',
    'followers_count',
    'follows_count',
    'media_count',
    'account_type',
    'ig_id'
  ].join(',');

  const url = `https://graph.facebook.com/v19.0/${igUserId}?fields=${fields}&access_token=${GRAPH_API_TOKEN}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data;
}

/**
 * Fetch audience insights for managed accounts
 */
async function fetchAudienceInsights(igUserId) {
  const metrics = [
    'audience_gender_age',
    'audience_country', 
    'audience_city',
    'audience_locale'
  ].join(',');

  const url = `https://graph.facebook.com/v19.0/${igUserId}/insights?metric=${metrics}&period=lifetime&access_token=${GRAPH_API_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    // Convert insights array to object
    const insights = {};
    if (data.data) {
      data.data.forEach(insight => {
        insights[insight.name] = insight.values[0]?.value || null;
      });
    }
    
    return insights;
  } catch (error) {
    console.warn('Audience insights not available:', error.message);
    return {};
  }
}

/**
 * Fetch account-level insights for managed accounts
 */
async function fetchAccountInsights(igUserId) {
  const metrics = [
    'impressions',
    'reach',
    'profile_views',
    'website_clicks'
  ].join(',');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const since = yesterday.toISOString().split('T')[0];
  
  const today = new Date();
  const until = today.toISOString().split('T')[0];

  const url = `https://graph.facebook.com/v19.0/${igUserId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${GRAPH_API_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    // Convert insights array to object
    const insights = {};
    if (data.data) {
      data.data.forEach(insight => {
        insights[insight.name] = insight.values[0]?.value || 0;
      });
    }
    
    return insights;
  } catch (error) {
    console.warn('Account insights not available:', error.message);
    return {};
  }
}

/**
 * Fetch media with detailed information including comments and insights
 */
async function fetchMediaWithDetails(igUserId, limit = 25) {
  const mediaFields = [
    'id',
    'media_type',
    // 'media_url', // Removed - don't fetch temporary CDN URLs
    'thumbnail_url',
    'permalink',
    'caption',
    'timestamp',
    'like_count',
    'comments_count',
    'children{id,media_type,thumbnail_url}' // Also removed media_url from children
  ].join(',');

  const url = `https://graph.facebook.com/v19.0/${igUserId}/media?fields=${mediaFields}&limit=${limit}&access_token=${GRAPH_API_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const mediaWithDetails = [];
    
    if (data.data) {
      for (const media of data.data) {
        try {
          // Fetch insights for each media
          const insights = await fetchMediaInsights(media.id);
          
          // Fetch comments for each media (limit to 10 recent comments)
          const comments = await fetchMediaComments(media.id, 10);
          
          mediaWithDetails.push({
            ...media,
            insights,
            comments
          });
        } catch (mediaError) {
          console.warn(`Failed to fetch details for media ${media.id}:`, mediaError.message);
          mediaWithDetails.push(media);
        }
      }
    }
    
    return mediaWithDetails;
  } catch (error) {
    console.warn('Media data not available:', error.message);
    return [];
  }
}

/**
 * Fetch insights for a specific media object
 */
async function fetchMediaInsights(mediaId) {
  const metrics = [
    'impressions',
    'reach', 
    'engagement',
    'saved',
    'video_views'
  ].join(',');

  const url = `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=${metrics}&access_token=${GRAPH_API_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const insights = {};
    if (data.data) {
      data.data.forEach(insight => {
        insights[insight.name] = insight.values[0]?.value || 0;
      });
    }
    
    return insights;
  } catch (error) {
    return {};
  }
}

/**
 * Fetch comments for a specific media object
 */
async function fetchMediaComments(mediaId, limit = 10) {
  const commentFields = [
    'id',
    'text',
    'username',
    'timestamp',
    'replies{id,text,username,timestamp}'
  ].join(',');

  const url = `https://graph.facebook.com/v19.0/${mediaId}/comments?fields=${commentFields}&limit=${limit}&access_token=${GRAPH_API_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch mentions for managed accounts
 */
async function fetchMentions(igUserId, limit = 25) {
  const mentionFields = [
    'id',
    'media_type',
    'media_url',
    'permalink',
    'caption',
    'timestamp'
  ].join(',');

  const url = `https://graph.facebook.com/v19.0/${igUserId}/mentions?fields=${mentionFields}&limit=${limit}&access_token=${GRAPH_API_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.data || [];
  } catch (error) {
    console.warn('Mentions not available:', error.message);
    return [];
  }
}

/**
 * Main function that replaces fetchInstagramWithFallback
 */
async function fetchInstagramWithFallback(baseIgUserId = DEFAULT_IG_USER_ID, targetUsername, allowSimulation = false) {
  try {
    const details = await fetchComprehensiveInstagramData(baseIgUserId, targetUsername);
    return { details, success: true };
  } catch (error) {
    console.warn('Instagram API failed:', error.message);
    throw error;
  }
}

/**
 * Generate a formatted string of Instagram details for display
 */
function formatInstagramDetails(details) {
  let formatted = `Instagram details for @${details.username}:\n`;
  
  if (details.name) {
    formatted += `Name: ${details.name}\n`;
  }
  
  if (details.account_type) {
    formatted += `Account type: ${details.account_type}\n`;
  }
  
  if (details.is_verified) {
    formatted += `✓ Verified Account\n`;
  }
  
  if (details.biography) formatted += `Bio: ${details.biography}\n`;
  if (details.website) formatted += `Website: ${details.website}\n`;
  if (typeof details.followers_count === 'number') formatted += `Followers: ${details.followers_count.toLocaleString()}\n`;
  if (typeof details.follows_count === 'number') formatted += `Following: ${details.follows_count.toLocaleString()}\n`;
  if (typeof details.media_count === 'number') formatted += `Posts: ${details.media_count.toLocaleString()}\n`;
  
  if (details.hasDetailedAccess) {
    formatted += `\n--- Additional Details Available ---\n`;
    if (details.insights) {
      formatted += `Recent Profile Views: ${details.insights.profile_views || 'N/A'}\n`;
      formatted += `Recent Website Clicks: ${details.insights.website_clicks || 'N/A'}\n`;
    }
    if (details.media && details.media.length > 0) {
      formatted += `Recent Posts: ${details.media.length} fetched with detailed insights\n`;
    }
  }
  
  return formatted;
}

module.exports = {
  fetchInstagramAccountDetails: fetchComprehensiveInstagramData, // Backward compatibility
  fetchInstagramWithFallback,
  formatInstagramDetails,
}; 