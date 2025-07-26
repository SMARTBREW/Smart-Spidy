const { supabaseAdmin } = require('../config/supabase');

/**
 * Get campaign DM template based on profession and campaign
 * @param {string} profession - User's profession
 * @param {string} campaign - Campaign name (default: 'pads for freedom')
 * @returns {Object|null} - Campaign DM template or null if not found
 */
async function getCampaignDM(profession, campaign = 'pads for freedom') {
  try {
    console.log('Getting campaign DM for profession:', profession, 'campaign:', campaign);
    
    // First, try direct text search for exact profession match
    const { data: directMatch, error: directError } = await supabaseAdmin
      .from('campaign_dms')
      .select('*')
      .ilike('profession', `%${profession}%`)
      .ilike('campaign', `%${campaign}%`)
      .limit(1);

    if (directMatch && directMatch.length > 0) {
      console.log('Found direct match for campaign DM');
      return directMatch[0];
    }

    // If no direct match, try broader profession matching
    const professionVariants = [
      profession,
      profession.toLowerCase(),
      // Add common profession mappings
      profession.includes('chairman') ? 'business leader' : null,
      profession.includes('ceo') ? 'entrepreneur' : null,
      profession.includes('founder') ? 'entrepreneur' : null,
      profession.includes('business') ? 'entrepreneur' : null,
      profession.includes('director') ? 'business leader' : null,
    ].filter(Boolean);

    console.log('Trying profession variants:', professionVariants);
    
    for (const variant of professionVariants) {
      const { data: variantMatch, error: variantError } = await supabaseAdmin
        .from('campaign_dms')
        .select('*')
        .ilike('profession', `%${variant}%`)
        .ilike('campaign', `%${campaign}%`)
        .limit(1);

      if (variantMatch && variantMatch.length > 0) {
        console.log(`Found match for variant "${variant}"`);
        return variantMatch[0];
      }
    }

    // If no matches found, return null
    console.log('No campaign DM found for profession:', profession, 'campaign:', campaign);
    return null;
  } catch (error) {
    console.error('Error getting campaign DM:', error);
    return null;
  }
}

/**
 * Replace template placeholders with dynamic values
 * @param {string} template - DM template with placeholders
 * @param {string} chatName - Name to replace {Name} placeholder
 * @param {string} volunteerName - Name to replace {Volunteer Name} placeholder
 * @returns {string} - Template with replaced values
 */
function replaceDMTemplate(template, chatName, volunteerName = 'Smart Spidy Team') {
  try {
    return template
      .replace(/\{Name\}/g, chatName)
      .replace(/\{Volunteer Name\}/g, volunteerName);
  } catch (error) {
    console.error('Error replacing DM template:', error);
    return template;
  }
}

/**
 * Check if user message is requesting a first DM (case insensitive)
 * @param {string} message - User's message
 * @returns {boolean} - True if message is requesting first DM
 */
function isFirstDMRequest(message) {
  const normalizedMessage = message.toLowerCase().trim();
  const firstDMPatterns = [
    'first dm',
    'first d.m',
    'firstdm',
    '1st dm',
    'initial dm',
    'opening dm'
  ];
  
  return firstDMPatterns.some(pattern => normalizedMessage.includes(pattern));
}

module.exports = {
  getCampaignDM,
  replaceDMTemplate,
  isFirstDMRequest
}; 