import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase environment variables are not defined');
}

class SupabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  async getRelevantContext(query: string): Promise<string> {
    try {
      console.log('Getting relevant context for query:', query);
      
      // First, generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      console.log('Generated embedding, length:', queryEmbedding.length);
      
      // Search for similar embeddings in Supabase
      console.log('Calling match_smartspidy_embeddings RPC...');
      const { data, error } = await this.supabase.rpc("match_smartspidy_embeddings", {
        query_embedding: queryEmbedding,
        match_count: 5
      });

      if (error) {
        console.error('Supabase search error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return '';
      }

      console.log('RPC call successful, data:', data);
      
      // Return concatenated relevant context
      if (data && data.length > 0) {
        const context = data.map((x: any) => x.text).join("\n---\n");
        console.log('Found context, length:', context.length);
        return context;
      } else {
        console.log('No relevant context found in database');
        return '';
      }
    } catch (error) {
      console.error('Error getting relevant context:', error);
      return '';
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-small"
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const result = await response.json();
      return result.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async storeTrainingData(trainingData: {
    userQuestion: string;
    assistantAnswer: string;
    embedding?: number[];
  }): Promise<void> {
    try {
      // Generate embedding if not provided
      const embedding = trainingData.embedding || await this.generateEmbedding(trainingData.userQuestion);
      
      console.log('Storing training data:', {
        text: trainingData.userQuestion,
        embeddingLength: embedding.length,
        embeddingType: typeof embedding
      });
      
      // Store in smartspidy_embeddings table
      const { error } = await this.supabase
        .from('smartspidy_embeddings')
        .insert({
          text: trainingData.userQuestion, // Store the question as text
          embedding: embedding
        });

      if (error) {
        console.error('Error storing training data:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (error) {
        console.error('Error storing training data:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error storing training data:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService(); 