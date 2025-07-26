const { supabaseAdmin } = require('../config/supabase');
const { generateEmbedding } = require('../services/openaiService');

async function testRPCFunction() {
  try {
    console.log('🧪 Testing RPC Function directly...');
    
    // First, let's check what data actually exists
    console.log('\n📊 Checking existing data...');
    const { data: allData, error: dataError } = await supabaseAdmin
      .from('smartspidy')
      .select('id, campaign, combined_text, embedding')
      .eq('campaign', 'Pads For Freedom')
      .limit(3);

    if (dataError) {
      console.error('❌ Error fetching data:', dataError);
      return;
    }

    console.log(`📋 Found ${allData.length} records for 'Pads For Freedom'`);
    
    // Check if embeddings exist
    allData.forEach((record, index) => {
      console.log(`\n📄 Record ${index + 1}:`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Campaign: ${record.campaign}`);
      console.log(`   Text: ${record.combined_text?.substring(0, 100)}...`);
      console.log(`   Has Embedding: ${record.embedding ? 'YES (' + record.embedding.length + ' dims)' : 'NO'}`);
    });

    if (allData.length === 0) {
      console.log('❌ No data found! Check your database.');
      return;
    }

    // Generate a test query embedding
    console.log('\n🔍 Generating test query embedding...');
    const testQuery = 'what is the cost to support one child';
    const queryEmbedding = await generateEmbedding(testQuery);
    console.log(`✅ Query embedding generated, length: ${queryEmbedding.length}`);

    // Test the RPC function with different thresholds
    const thresholds = [0.9, 0.7, 0.5, 0.3, 0.1, 0.0];
    
    for (const threshold of thresholds) {
      console.log(`\n🔍 Testing RPC with threshold ${threshold}...`);
      
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('search_campaign_embeddings', {
        query_embedding: queryEmbedding,
        campaign_name: 'Pads For Freedom',
        match_threshold: threshold,
        match_count: 5
      });

      if (rpcError) {
        console.error(`❌ RPC Error (threshold ${threshold}):`, rpcError);
      } else {
        console.log(`📊 RPC Results (threshold ${threshold}): ${rpcData ? rpcData.length : 0} items`);
        
        if (rpcData && rpcData.length > 0) {
          rpcData.forEach((item, index) => {
            console.log(`   ${index + 1}. Similarity: ${item.similarity?.toFixed(4)}, Text: ${item.combined_text?.substring(0, 80)}...`);
          });
          
          // Found results, no need to test lower thresholds
          break;
        }
      }
    }

    // Test the RPC function with a broader query
    console.log('\n🔍 Testing with broader query...');
    const broadQuery = 'Pads For Freedom campaign';
    const broadEmbedding = await generateEmbedding(broadQuery);
    
    const { data: broadData, error: broadError } = await supabaseAdmin.rpc('search_campaign_embeddings', {
      query_embedding: broadEmbedding,
      campaign_name: 'Pads For Freedom',
      match_threshold: 0.1,
      match_count: 5
    });

    if (broadError) {
      console.error('❌ Broad query RPC Error:', broadError);
    } else {
      console.log(`📊 Broad query results: ${broadData ? broadData.length : 0} items`);
      if (broadData && broadData.length > 0) {
        broadData.forEach((item, index) => {
          console.log(`   ${index + 1}. Similarity: ${item.similarity?.toFixed(4)}, Text: ${item.combined_text?.substring(0, 80)}...`);
        });
      }
    }

    // Test manual similarity calculation
    console.log('\n🧮 Testing manual similarity calculation...');
    if (allData.length > 0 && allData[0].embedding) {
      try {
        // Manual cosine similarity test using SQL
        const { data: manualData, error: manualError } = await supabaseAdmin
          .from('smartspidy')
          .select('id, campaign, combined_text, (1 - (embedding <=> $1)) as similarity')
          .eq('campaign', 'Pads For Freedom')
          .order('similarity', { ascending: false })
          .limit(3);

        if (manualError) {
          console.error('❌ Manual similarity error:', manualError);
        } else {
          console.log(`📊 Manual similarity results: ${manualData ? manualData.length : 0} items`);
          manualData?.forEach((item, index) => {
            console.log(`   ${index + 1}. Similarity: ${item.similarity?.toFixed(4)}, Text: ${item.combined_text?.substring(0, 80)}...`);
          });
        }
      } catch (manualError) {
        console.error('❌ Manual test failed:', manualError);
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the test
if (require.main === module) {
  testRPCFunction()
    .then(() => {
      console.log('\n✅ RPC test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ RPC test failed:', error);
      process.exit(1);
    });
}

module.exports = { testRPCFunction }; 