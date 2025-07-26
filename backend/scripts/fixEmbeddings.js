const { supabaseAdmin } = require('../config/supabase');
const { generateEmbedding } = require('../services/openaiService');

async function fixEmbeddings() {
  try {
    console.log('🚀 Fixing embeddings with correct dimensions...');
    
    // Get all records
    console.log('📊 Fetching all records...');
    const { data: records, error } = await supabaseAdmin
      .from('smartspidy')
      .select('id, combined_text, campaign, embedding');

    if (error) {
      console.error('❌ Error fetching records:', error);
      return;
    }

    console.log(`📋 Found ${records.length} records total`);

    // Check embedding dimensions
    records.forEach((record, index) => {
      console.log(`\n📄 Record ${index + 1}:`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Campaign: ${record.campaign}`);
      console.log(`   Text: ${record.combined_text?.substring(0, 50)}...`);
      console.log(`   Embedding dims: ${record.embedding ? record.embedding.length : 'NULL'}`);
    });

    // Fix each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`\n🔄 Fixing record ${i + 1}/${records.length}`);
      console.log(`📝 ID: ${record.id}`);
      console.log(`📋 Campaign: ${record.campaign}`);

      if (!record.combined_text) {
        console.log('⚠️ Skipping record with empty combined_text');
        continue;
      }

      try {
        // Generate correct embedding using OpenAI ada-002
        console.log('🔍 Generating correct embedding (1536 dims)...');
        const correctEmbedding = await generateEmbedding(record.combined_text);
        console.log(`✅ Correct embedding generated, length: ${correctEmbedding.length}`);

        if (correctEmbedding.length !== 1536) {
          console.error(`❌ Unexpected embedding dimension: ${correctEmbedding.length}`);
          continue;
        }

        // Update the record with the correct embedding
        console.log('💾 Saving correct embedding to database...');
        const { error: updateError } = await supabaseAdmin
          .from('smartspidy')
          .update({ embedding: correctEmbedding })
          .eq('id', record.id);

        if (updateError) {
          console.error('❌ Error updating record:', updateError);
        } else {
          console.log('✅ Correct embedding saved successfully');
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (embeddingError) {
        console.error('❌ Error generating embedding for record:', record.id, embeddingError);
      }
    }

    console.log('\n🎉 Embedding fix process completed!');
    
    // Verify the results
    console.log('\n🔍 Verifying corrected results...');
    const { data: verifyRecords, error: verifyError } = await supabaseAdmin
      .from('smartspidy')
      .select('id, campaign, embedding')
      .eq('campaign', 'Pads For Freedom');

    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
    } else {
      console.log(`✅ ${verifyRecords.length} records verified for 'Pads For Freedom'`);
      
      verifyRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, Embedding dims: ${record.embedding ? record.embedding.length : 'NULL'}`);
      });
    }

    // Test the RPC function again
    console.log('\n🧪 Testing RPC function with corrected embeddings...');
    const testQuery = 'what is the cost to support one child';
    const queryEmbedding = await generateEmbedding(testQuery);
    
    const { data: testData, error: testError } = await supabaseAdmin.rpc('search_campaign_embeddings', {
      query_embedding: queryEmbedding,
      campaign_name: 'Pads For Freedom',
      match_threshold: 0.3,
      match_count: 5
    });

    if (testError) {
      console.error('❌ RPC test error:', testError);
    } else {
      console.log(`🎉 RPC test results: ${testData ? testData.length : 0} items found!`);
      if (testData && testData.length > 0) {
        testData.forEach((item, index) => {
          console.log(`   ${index + 1}. Similarity: ${item.similarity?.toFixed(4)}, Text: ${item.combined_text?.substring(0, 80)}...`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
if (require.main === module) {
  fixEmbeddings()
    .then(() => {
      console.log('\n✅ Embedding fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Embedding fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixEmbeddings }; 