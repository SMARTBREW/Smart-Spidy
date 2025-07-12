import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

export const testSupabaseConnection = async () => {
  console.log('Testing Supabase connection...');
  console.log('SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Not set');
  console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'Set' : 'Not set');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase environment variables');
    return false;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Test basic connection and get table info
    const { data, error } = await supabase
      .from('smartspidy_embeddings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }

    console.log('Supabase connection successful');
    console.log('Table structure sample:', data);
    
    // Test RPC function
    const testEmbedding = new Array(1536).fill(0.1); // Simple test embedding
    const { data: rpcData, error: rpcError } = await supabase.rpc("match_smartspidy_embeddings", {
      query_embedding: testEmbedding,
      match_count: 1
    });

    if (rpcError) {
      console.error('RPC function test failed:', rpcError);
      return false;
    }

    console.log('RPC function test successful');
    return true;
  } catch (error) {
    console.error('Supabase test error:', error);
    return false;
  }
};

export const testInsertRecord = async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase environment variables');
    return false;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Try to insert a simple test record
    const testEmbedding = new Array(1536).fill(0.1);
    const { data, error } = await supabase
      .from('smartspidy_embeddings')
      .insert({
        text: 'Test knowledge entry',
        embedding: testEmbedding
      })
      .select();

    if (error) {
      console.error('Insert test failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('Insert test successful:', data);
    return true;
  } catch (error) {
    console.error('Insert test error:', error);
    return false;
  }
}; 