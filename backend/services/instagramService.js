const config = require('../config/config');
const fetch = require('node-fetch');

// Instagram API configuration
const GRAPH_API_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || "EAAPAHrBSB58BOyPaATZAZBStnHZAUgrjXTpZBfukYSwBAJX4xAO4ZBg6r9ZArs7biJmtYoCuTxBL5fPtmvbMZAIsIXyByZA2vInyzacZBHc56hBcZCYELiJz3L5UgW72x4gPGoGXZBrXOssgWThiQ1Un73q4U6Cw2TZBqDZCXcr3cE3oBhKaXOBnmUCSk4Ts0C1CO83HB";
const DEFAULT_IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "17841457608493749";

/**
 * Fetch Instagram business/creator account details using the business_discovery endpoint.
 * @param {string} baseIgUserId - The IG User ID of a business/creator account you manage
 * @param {string} targetUsername - The Instagram username to look up
 */
async function fetchInstagramAccountDetails(baseIgUserId = DEFAULT_IG_USER_ID, targetUsername) {
  try {
    const url = `https://graph.facebook.com/v19.0/${baseIgUserId}?fields=business_discovery.username(${targetUsername}){username,followers_count,follows_count,media_count,website,biography}&access_token=${GRAPH_API_TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.business_discovery && data.business_discovery.username) {
      return data.business_discovery;
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
  } catch (error) {
    console.error('Error fetching Instagram details:', error);
    throw error;
  }
}

/**
 * Simulate Instagram data when API is not available
 * @param {string} username - Instagram username
 */
async function simulateInstagramData(username) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    username: username,
    name: `${username.charAt(0).toUpperCase() + username.slice(1)} (Simulated)`,
    account_type: 'BUSINESS',
    biography: 'Entrepreneur | Passionate about making a difference | Contact for collaborations',
    followers_count: Math.floor(Math.random() * 10000) + 1000,
    follows_count: Math.floor(Math.random() * 500) + 50,
    media_count: Math.floor(Math.random() * 500) + 50,
    website: null,
    isSimulated: true
  };
}

/**
 * Smart Instagram fetcher with fallback to simulation
 * @param {string} baseIgUserId - The IG User ID of a business/creator account you manage
 * @param {string} targetUsername - The Instagram username to look up
 * @param {boolean} allowSimulation - Whether to fall back to simulated data on error
 */
async function fetchInstagramWithFallback(baseIgUserId = DEFAULT_IG_USER_ID, targetUsername, allowSimulation = true) {
  try {
    const details = await fetchInstagramAccountDetails(baseIgUserId, targetUsername);
    return { details, success: true };
  } catch (error) {
    console.warn('Instagram API failed, attempting fallback:', error.message);
    
    if (allowSimulation) {
      try {
        const simulatedDetails = await simulateInstagramData(targetUsername);
        return { 
          details: simulatedDetails, 
          success: true, 
          isSimulated: true 
        };
      } catch (simulationError) {
        console.error('Even simulation failed:', simulationError);
        throw new Error(`Unable to fetch Instagram data for ${targetUsername}. Please check the username and try again.`);
      }
    } else {
      throw error;
    }
  }
}

/**
 * Generate a formatted string of Instagram details for display
 * @param {any} details - Instagram account details
 */
function formatInstagramDetails(details) {
  let formatted = `Instagram details for @${details.username}:\n`;
  
  if (details.isSimulated) {
    formatted += `⚠️ Note: This is simulated data (Instagram API unavailable)\n\n`;
  }
  
  if (details.name || details.full_name) {
    formatted += `Name: ${details.name || details.full_name}\n`;
  } else {
    const displayName = details.username.charAt(0).toUpperCase() + details.username.slice(1);
    formatted += `Display Name: ${displayName}\n`;
  }
  
  if (details.account_type) {
    formatted += `Account type: ${details.account_type}\n`;
  } else {
    formatted += `Account type: Business/Creator (via business_discovery)\n`;
  }
  
  if (details.biography) formatted += `Bio: ${details.biography}\n`;
  if (typeof details.followers_count === 'number') formatted += `Followers: ${details.followers_count.toLocaleString()}\n`;
  if (typeof details.follows_count === 'number') formatted += `Following: ${details.follows_count.toLocaleString()}\n`;
  if (typeof details.media_count === 'number') formatted += `Posts: ${details.media_count.toLocaleString()}\n`;
  if (details.website) formatted += `Website: ${details.website}\n`;
  
  return formatted;
}

module.exports = {
  fetchInstagramAccountDetails,
  fetchInstagramWithFallback,
  formatInstagramDetails,
  simulateInstagramData,
}; 