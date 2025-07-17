const GRAPH_API_TOKEN = "EAAXy9R6Gng0BPCAFMc9MBa197iXQidushf5KHivXhr5lt2kjiWo1gzqqIgkka6x1YCUI7vTHawKAWmnu9GVBZC2Qu2qbowjxvxPgZACr2nV5VRCZABRQD9JYMzBcDvSg2nrWKXyetAARKah1W8iePjq8fJhIvxojBasaKhosJOcNZAsWTbVCr9tCshZA6SBO5";

/**
 * Fetch Instagram business/creator account details using the business_discovery endpoint.
 * @param {string} baseIgUserId - The IG User ID of a business/creator account you manage (as base for the API call)
 * @param {string} targetUsername - The Instagram username to look up
 */
export async function fetchInstagramAccountDetails(baseIgUserId: string, targetUsername: string) {
  const url = `https://graph.facebook.com/v19.0/${baseIgUserId}?fields=business_discovery.username(${targetUsername}){username,followers_count,follows_count,media_count,website,biography}&access_token=${GRAPH_API_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.business_discovery && data.business_discovery.username) {
    return data.business_discovery;
  } else if (data.error) {
    throw new Error(data.error.message || 'Could not fetch Instagram details.');
  } else {
    throw new Error('Account not found or not a business/creator account.');
  }
} 