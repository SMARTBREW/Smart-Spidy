import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined in environment variables');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
}

// Define the database types for better TypeScript support
export interface KnowledgeBaseRow {
  id: string;
  combined_text: string;
  smartspidy_chunk: string;
  smartspidy_embedding: number[];
  created_at: string;
}

export interface MatchSmartSpidyChunksParams {
  query_embedding: number[];
  match_threshold?: number;
  match_count?: number;
}

export interface MatchSmartSpidyChunksResult {
  id: string;
  smartspidy_chunk: string;
  combined_text: string;
  similarity: number;
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Since we're not using auth in this RAG system
  },
});

// Helper function to call the match_smartspidy_chunks RPC
export const matchSmartSpidyChunks = async (
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<MatchSmartSpidyChunksResult[]> => {
  try {
    const { data, error } = await supabase.rpc('match_smartspidy_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('Error calling match_smartspidy_chunks:', error);
      throw new Error(`Supabase RPC error: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to match SmartSpidy chunks:', error);
    throw error;
  }
};

// Helper function to test the connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('SmartSpidy_KnowledgeBase')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}; 