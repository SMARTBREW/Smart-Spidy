const { supabaseAdmin } = require('../config/supabase');
const { generateEmbedding } = require('../services/openaiService');

async function generateEmbeddingsForExistingData() {
  try {
    console.log('🚀 Starting embedding generation process...');
    
    // Get all records that don't have embeddings
    console.log('📊 Fetching records without embeddings...');
    const { data: records, error } = await supabaseAdmin
      .from('smartspidy')
      .select('id, combined_text, campaign, embedding')
      .is('embedding', null);

    if (error) {
      console.error('❌ Error fetching records:', error);
      return;
    }

    console.log(`📋 Found ${records.length} records without embeddings`);

    if (records.length === 0) {
      console.log('✅ All records already have embeddings!');
      return;
    }

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`\n🔄 Processing record ${i + 1}/${records.length}`);
      console.log(`📝 ID: ${record.id}`);
      console.log(`📋 Campaign: ${record.campaign}`);
      console.log(`📄 Text preview: ${record.combined_text?.substring(0, 100)}...`);

      if (!record.combined_text) {
        console.log('⚠️ Skipping record with empty combined_text');
        continue;
      }

      try {
        // Generate embedding
        console.log('🔍 Generating embedding...');
        const embedding = await generateEmbedding(record.combined_text);
        console.log(`✅ Embedding generated, length: ${embedding.length}`);

        // Update the record with the embedding
        console.log('💾 Saving embedding to database...');
        const { error: updateError } = await supabaseAdmin
          .from('smartspidy')
          .update({ embedding: embedding })
          .eq('id', record.id);

        if (updateError) {
          console.error('❌ Error updating record:', updateError);
        } else {
          console.log('✅ Embedding saved successfully');
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (embeddingError) {
        console.error('❌ Error generating embedding for record:', record.id, embeddingError);
      }
    }

    console.log('\n🎉 Embedding generation process completed!');
    
    // Verify the results
    console.log('\n🔍 Verifying results...');
    const { data: updatedRecords, error: verifyError } = await supabaseAdmin
      .from('smartspidy')
      .select('id, campaign, embedding')
      .not('embedding', 'is', null);

    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
    } else {
      console.log(`✅ ${updatedRecords.length} records now have embeddings`);
      
      // Show count by campaign
      const campaignCounts = {};
      updatedRecords.forEach(record => {
        campaignCounts[record.campaign] = (campaignCounts[record.campaign] || 0) + 1;
      });
      
      console.log('\n📊 Records with embeddings by campaign:');
      Object.entries(campaignCounts).forEach(([campaign, count]) => {
        console.log(`   ${campaign}: ${count} records`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
if (require.main === module) {
  generateEmbeddingsForExistingData()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateEmbeddingsForExistingData }; 