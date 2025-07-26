/**
 * Campaign mapping utilities for consistent campaign name handling
 */

// Mapping from product names to campaign names
const PRODUCT_TO_CAMPAIGN = {
  'Pads For Freedom': 'Pads For Freedom',
  'Bowls Of Hope': 'Bowls Of Hope',
  'Wings Of Hope': 'Wings Of Hope'
};

// Reverse mapping from campaign names to product names
const CAMPAIGN_TO_PRODUCT = {
  'Pads For Freedom': 'Pads For Freedom',
  'Bowls Of Hope': 'Bowls Of Hope',
  'Wings Of Hope': 'Wings Of Hope'
};

// Valid campaign names for validation
const VALID_CAMPAIGNS = [
  'Pads For Freedom',
  'Bowls Of Hope',
  'Wings Of Hope'
];

/**
 * Map product name to campaign name
 * @param {string} product - Product name from chat
 * @returns {string} - Corresponding campaign name
 */
function mapProductToCampaign(product) {
  if (!product) return 'Pads For Freedom'; // Default campaign
  
  // Since products and campaigns are now the same, just return the product
  return PRODUCT_TO_CAMPAIGN[product] || product || 'Pads For Freedom';
}

/**
 * Map campaign name to product name
 * @param {string} campaign - Campaign name
 * @returns {string} - Corresponding product name
 */
function mapCampaignToProduct(campaign) {
  if (!campaign) return 'Pads For Freedom'; // Default product
  
  // Since products and campaigns are now the same, just return the campaign
  return CAMPAIGN_TO_PRODUCT[campaign] || campaign || 'Pads For Freedom';
}

/**
 * Validate if campaign name is valid
 * @param {string} campaign - Campaign name to validate
 * @returns {boolean} - True if valid campaign
 */
function isValidCampaign(campaign) {
  if (!campaign) return false;
  return VALID_CAMPAIGNS.includes(campaign);
}

/**
 * Get all valid campaign names
 * @returns {string[]} - Array of valid campaign names
 */
function getValidCampaigns() {
  return [...VALID_CAMPAIGNS];
}

/**
 * Normalize campaign name for database queries
 * @param {string} campaign - Campaign name to normalize
 * @returns {string} - Normalized campaign name
 */
function normalizeCampaignName(campaign) {
  if (!campaign) return 'Pads For Freedom';
  
  return VALID_CAMPAIGNS.includes(campaign) ? campaign : 'Pads For Freedom';
}

module.exports = {
  mapProductToCampaign,
  mapCampaignToProduct,
  isValidCampaign,
  getValidCampaigns,
  normalizeCampaignName,
  PRODUCT_TO_CAMPAIGN,
  CAMPAIGN_TO_PRODUCT,
  VALID_CAMPAIGNS
}; 