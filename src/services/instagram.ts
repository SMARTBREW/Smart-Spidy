const GRAPH_API_TOKEN = "EAAPAHrBSB58BOyPaATZAZBStnHZAUgrjXTpZBfukYSwBAJX4xAO4ZBg6r9ZArs7biJmtYoCuTxBL5fPtmvbMZAIsIXyByZA2vInyzacZBHc56hBcZCYELiJz3L5UgW72x4gPGoGXZBrXOssgWThiQ1Un73q4U6Cw2TZBqDZCXcr3cE3oBhKaXOBnmUCSk4Ts0C1CO83HB";

// Updated with working Instagram Business Account ID from your API test
// This ID (17841457608493749) has been verified to work with business_discovery
let DEFAULT_IG_USER_ID = "17841457608493749"; // ✅ Working Instagram Business Account ID

/**
 * Get the current Instagram configuration
 */
export function getInstagramConfig() {
  return {
    userID: DEFAULT_IG_USER_ID,
    hasToken: !!GRAPH_API_TOKEN,
    tokenLength: GRAPH_API_TOKEN?.length || 0
  };
}

/**
 * Update the Instagram User ID (for testing purposes)
 * In production, this should be set via environment variables
 */
export function updateInstagramUserID(newUserID: string) {
  DEFAULT_IG_USER_ID = newUserID;
  return DEFAULT_IG_USER_ID;
}

/**
 * Fetch Instagram business/creator account details using the business_discovery endpoint.
 * @param {string} baseIgUserId - The IG User ID of a business/creator account you manage (as base for the API call)
 * @param {string} targetUsername - The Instagram username to look up
 */
export async function fetchInstagramAccountDetails(baseIgUserId: string = DEFAULT_IG_USER_ID, targetUsername: string) {
  // Updated API call - removed unsupported fields 'name' and 'account_type' 
  // Valid fields for IGUser in business_discovery: username, followers_count, follows_count, media_count, website, biography
  const url = `https://graph.facebook.com/v19.0/${baseIgUserId}?fields=business_discovery.username(${targetUsername}){username,followers_count,follows_count,media_count,website,biography}&access_token=${GRAPH_API_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.business_discovery && data.business_discovery.username) {
    return data.business_discovery;
  } else if (data.error) {
    // Enhanced error handling with specific error types
    const errorMessage = data.error.message || 'Could not fetch Instagram details.';
    
    if (errorMessage.includes('does not exist') || errorMessage.includes('missing permissions')) {
      throw new Error(`Instagram API Error: The base Instagram account ID (${baseIgUserId}) is invalid or lacks permissions. Please check your Instagram Business Account setup.`);
    } else if (errorMessage.includes('Unsupported get request')) {
      throw new Error(`Instagram API Error: The account ${targetUsername} may not be a business/creator account or is private.`);
    } else if (errorMessage.includes('nonexisting field')) {
      throw new Error(`Instagram API Error: Requested field not available for this account type. Some fields may not be accessible.`);
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
 * Fetch Instagram account details with profession extraction
 * @param {string} baseIgUserId - The IG User ID of a business/creator account you manage
 * @param {string} targetUsername - The Instagram username to look up
 * @returns {Promise<{details: any, extractedProfession?: string}>}
 */
export async function fetchInstagramWithProfession(baseIgUserId: string = DEFAULT_IG_USER_ID, targetUsername: string) {
  try {
    const details = await fetchInstagramAccountDetails(baseIgUserId, targetUsername);
    
    // Import supabaseService here to avoid circular imports
    const { supabaseService } = await import('./supabase');
    
    let extractedProfession: string | undefined;
    
    // Extract profession from bio if available
    if (details.biography) {
      try {
        // Clean up the biography text - handle escaped newlines and normalize
        const cleanedBio = details.biography
          .replace(/\\n/g, ' ') // Replace escaped newlines with spaces
          .replace(/\n/g, ' ')  // Replace actual newlines with spaces
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
        
        console.log('Cleaned bio for profession extraction:', cleanedBio);
        extractedProfession = await supabaseService.extractProfessionFromBio(cleanedBio);
        console.log('Extracted profession:', extractedProfession);
      } catch (error) {
        console.warn('Failed to extract profession from bio:', error);
        // Fallback profession extraction from common patterns
        const bioLower = details.biography.toLowerCase();
        if (bioLower.includes('chairman')) {
          extractedProfession = 'chairman';
        } else if (bioLower.includes('ceo')) {
          extractedProfession = 'ceo';
        } else if (bioLower.includes('founder')) {
          extractedProfession = 'founder';
        } else if (bioLower.includes('director')) {
          extractedProfession = 'director';
        } else if (bioLower.includes('entrepreneur')) {
          extractedProfession = 'entrepreneur';
        } else {
          extractedProfession = 'business leader';
        }
        console.log('Used fallback profession extraction:', extractedProfession);
      }
    }
    
    return {
      details,
      extractedProfession
    };
  } catch (error) {
    console.error('Error fetching Instagram details with profession:', error);
    throw error;
  }
}

/**
 * Fallback function to simulate Instagram data when API is not available
 * This can be used for testing purposes
 */
export async function simulateInstagramData(username: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const simulatedData = {
    username: username,
    // Note: name and account_type are not available from business_discovery API
    // Adding them here for simulation purposes only
    name: `${username.charAt(0).toUpperCase() + username.slice(1)} (Simulated)`,
    account_type: 'BUSINESS', // Simulated only
    biography: 'Entrepreneur | Passionate about making a difference | Contact for collaborations',
    followers_count: Math.floor(Math.random() * 10000) + 1000,
    follows_count: Math.floor(Math.random() * 500) + 50,
    media_count: Math.floor(Math.random() * 500) + 50,
    website: null
  };
  
  return simulatedData;
}

/**
 * Smart Instagram fetcher with fallback to simulation
 * @param {string} baseIgUserId - The IG User ID of a business/creator account you manage
 * @param {string} targetUsername - The Instagram username to look up
 * @param {boolean} allowSimulation - Whether to fall back to simulated data on error
 */
export async function fetchInstagramWithFallback(baseIgUserId: string = DEFAULT_IG_USER_ID, targetUsername: string, allowSimulation: boolean = true) {
  try {
    return await fetchInstagramWithProfession(baseIgUserId, targetUsername);
  } catch (error) {
    console.warn('Instagram API failed, attempting fallback:', error);
    
    if (allowSimulation) {
      try {
        const simulatedDetails = await simulateInstagramData(targetUsername);
        
        // Import supabaseService here to avoid circular imports
        const { supabaseService } = await import('./supabase');
        
        let extractedProfession: string | undefined;
        
        // Extract profession from simulated bio
        if (simulatedDetails.biography) {
          try {
            extractedProfession = await supabaseService.extractProfessionFromBio(simulatedDetails.biography);
          } catch (professionError) {
            console.warn('Failed to extract profession from simulated bio:', professionError);
            extractedProfession = 'general'; // Fallback profession
          }
        }
        
        return {
          details: { ...simulatedDetails, isSimulated: true },
          extractedProfession
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
 * @param {string} extractedProfession - Extracted profession (optional)
 */
export function formatInstagramDetails(details: any, extractedProfession?: string): string {
  let formatted = `Instagram details for @${details.username}:\n`;
  
  if (details.isSimulated) formatted += `⚠️ Note: This is simulated data (Instagram API unavailable)\n\n`;
  
  // Handle fields that may not be available from the API
  if (details.name) {
    formatted += `Name: ${details.name}\n`;
  } else {
    // Generate a display name from username if name is not available
    const displayName = details.username.charAt(0).toUpperCase() + details.username.slice(1);
    formatted += `Display Name: ${displayName}\n`;
  }
  
  if (details.account_type) {
    formatted += `Account type: ${details.account_type}\n`;
  } else {
    formatted += `Account type: Business/Creator (via business_discovery)\n`;
  }
  
  if (details.biography) formatted += `Bio: ${details.biography}\n`;
  if (extractedProfession) formatted += `Detected Profession: ${extractedProfession}\n`;
  if (typeof details.followers_count === 'number') formatted += `Followers: ${details.followers_count.toLocaleString()}\n`;
  if (typeof details.follows_count === 'number') formatted += `Following: ${details.follows_count.toLocaleString()}\n`;
  if (typeof details.media_count === 'number') formatted += `Posts: ${details.media_count.toLocaleString()}\n`;
  if (details.website) formatted += `Website: ${details.website}\n`;
  
  return formatted;
}

/**
 * Instructions for getting a valid Instagram Business Account ID
 */
export function getInstagramSetupInstructions(): string {
  return `
To fix Instagram API integration:

1. **Create Instagram Business Account**:
   - Convert your Instagram account to Business/Creator
   - Connect it to a Facebook Page

2. **Get Your Instagram Business Account ID**:
   - Visit: https://developers.facebook.com/tools/explorer/
   - Select your app and get user access token
   - Request: GET /me/accounts
   - Find your Facebook Page ID
   - Request: GET /{page-id}?fields=instagram_business_account
   - Use the returned instagram_business_account.id

3. **Update the Code**:
   - Replace DEFAULT_IG_USER_ID in instagram.ts
   - Ensure your access token has instagram_basic permissions

4. **Test the Integration**:
   - Try fetching a known Instagram business account
   - Check the console for detailed error messages
`;
} 