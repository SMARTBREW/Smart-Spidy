const express = require('express');
const { testCampaignData, getCampaignContext, generateEmbedding } = require('../services/openaiService');
const { supabaseAdmin } = require('../config/supabase');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

// Test campaign data existence
router.get('/campaign-data/:campaign', catchAsync(async (req, res) => {
  const { campaign } = req.params;
  
  console.log('Testing campaign data for:', campaign);
  const result = await testCampaignData(campaign);
  
  res.json({
    campaign,
    result,
    timestamp: new Date().toISOString()
  });
}));

// Test RAG context retrieval
router.post('/rag-context', catchAsync(async (req, res) => {
  const { query, campaign } = req.body;
  
  if (!query || !campaign) {
    return res.status(400).json({ error: 'Query and campaign are required' });
  }
  
  console.log('Testing RAG context for query:', query, 'campaign:', campaign);
  const context = await getCampaignContext(query, campaign);
  
  res.json({
    query,
    campaign,
    context: context || 'No context found',
    contextLength: context ? context.length : 0,
    timestamp: new Date().toISOString()
  });
}));

// Test direct database query
router.get('/direct-query/:campaign', catchAsync(async (req, res) => {
  const { campaign } = req.params;
  
  console.log('Direct database query for campaign:', campaign);
  
  const { data, error } = await supabaseAdmin
    .from('smartspidy')
    .select('id, campaign, combined_text, created_at')
    .eq('campaign', campaign)
    .limit(5);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    campaign,
    count: data?.length || 0,
    records: data?.map(item => ({
      id: item.id,
      campaign: item.campaign,
      text_preview: item.combined_text?.substring(0, 200) + '...',
      created_at: item.created_at
    })) || [],
    timestamp: new Date().toISOString()
  });
}));

// Test embedding generation
router.post('/test-embedding', catchAsync(async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  console.log('Testing embedding generation for text:', text.substring(0, 100) + '...');
  
  try {
    const embedding = await generateEmbedding(text);
    
    res.json({
      text: text.substring(0, 200) + '...',
      embedding_length: embedding.length,
      embedding_sample: embedding.slice(0, 5),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

module.exports = router; 