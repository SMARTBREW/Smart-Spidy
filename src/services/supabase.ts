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
      
      // Search for similar embeddings using the new match_smartspidy_chunks function
      console.log('Calling match_smartspidy_chunks RPC...');
      const { data, error } = await this.supabase.rpc("match_smartspidy_chunks", {
        query_embedding: queryEmbedding,
        match_count: 5,
        similarity_threshold: 0.5
      });

      if (error) {
        console.error('Supabase search error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return '';
      }

      console.log('RPC call successful, data:', data);
      
      // Return concatenated relevant context using the new schema
      if (data && data.length > 0) {
        const context = data.map((item: any) => {
          // Use combined_text if available, otherwise fall back to smartspidy_chunk
          return item.combined_text || item.smartspidy_chunk;
        }).join("\n---\n");
        console.log('Found context, length:', context.length);
        console.log('Context preview:', context.substring(0, 200) + '...');
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
          model: "text-embedding-3-small" // Using text-embedding-3-small as requested
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

  async storeKnowledgeData(data: {
    combinedText: string;
    smartspidyChunk: string;
    embedding?: number[];
  }): Promise<void> {
    try {
      // Generate embedding if not provided
      const embedding = data.embedding || await this.generateEmbedding(data.combinedText);
      
      console.log('Storing knowledge data:', {
        combinedText: data.combinedText.substring(0, 100) + '...',
        chunkLength: data.smartspidyChunk.length,
        embeddingLength: embedding.length,
      });
      
      // Store in smartspidy_knowledgebase table
      const { error } = await this.supabase
        .from('smartspidy_knowledgebase')
        .insert({
          combined_text: data.combinedText,
          smartspidy_chunk: data.smartspidyChunk,
          smartspidy_embedding: embedding
        });

      if (error) {
        console.error('Error storing knowledge data:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Knowledge data stored successfully');
    } catch (error) {
      console.error('Error storing knowledge data:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility - can be removed if not needed
  async storeTrainingData(trainingData: {
    userQuestion: string;
    assistantAnswer: string;
    embedding?: number[];
  }): Promise<void> {
    // Convert to new format and store
    await this.storeKnowledgeData({
      combinedText: `Q: ${trainingData.userQuestion}\nA: ${trainingData.assistantAnswer}`,
      smartspidyChunk: trainingData.userQuestion,
      embedding: trainingData.embedding
    });
  }

  async getFirstDMTemplates(profession: string, campaign: string = 'pads for freedom'): Promise<any[]> {
    try {
      console.log('Getting first DM templates for profession:', profession, 'campaign:', campaign);
      
      // First, try direct text search without embeddings for exact matches
      console.log('Trying direct profession match...');
      const { data: directMatch, error: directError } = await this.supabase
        .from('first_dm_templates')
        .select('*')
        .ilike('profession', `%${profession}%`)
        .ilike('campaign', `%${campaign}%`)
        .limit(3);

      if (directMatch && directMatch.length > 0) {
        console.log('Found direct matches:', directMatch.length);
        return directMatch.map(item => ({
          ...item,
          similarity: 1.0 // Perfect match
        }));
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
        const { data: variantMatch, error: variantError } = await this.supabase
          .from('first_dm_templates')
          .select('*')
          .ilike('profession', `%${variant}%`)
          .ilike('campaign', `%${campaign}%`)
          .limit(3);

        if (variantMatch && variantMatch.length > 0) {
          console.log(`Found matches for variant "${variant}":`, variantMatch.length);
          return variantMatch.map(item => ({
            ...item,
            similarity: 0.9 // High similarity for variant match
          }));
        }
      }

      // Fallback to embedding search if no text matches found
      console.log('No direct matches found, trying embedding search...');
      const professionEmbedding = await this.generateEmbedding(profession);
      console.log('Generated profession embedding, length:', professionEmbedding.length);
      
      const { data, error } = await this.supabase.rpc("match_first_dm_templates", {
        query_embedding: professionEmbedding,
        profession_filter: null, // Remove filter to get broader results
        campaign_filter: campaign,
        match_count: 3,
        similarity_threshold: 0.3 // Lower threshold for more results
      });

      if (error) {
        console.error('First DM templates search error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }

      console.log('Embedding search results:', data);
      return data || [];
    } catch (error) {
      console.error('Error getting first DM templates:', error);
      return [];
    }
  }

  async extractProfessionFromBio(bio: string): Promise<string> {
    try {
      console.log('Extracting profession from bio:', bio.substring(0, 100) + '...');
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a profession extraction expert. Extract the main profession/job title from the given Instagram bio. Return only the profession in 1-3 words (e.g., 'doctor', 'software engineer', 'business owner', 'student', 'fitness trainer', 'artist', etc.). If no clear profession is found, return 'general'."
            },
            {
              role: "user", 
              content: `Extract the profession from this Instagram bio: "${bio}"`
            }
          ],
          max_tokens: 20,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Profession extraction API error: ${response.status}`);
      }

      const result = await response.json();
      const profession = result.choices[0]?.message?.content?.trim().toLowerCase() || 'general';
      
      console.log('Extracted profession:', profession);
      return profession;
    } catch (error) {
      console.error('Error extracting profession from bio:', error);
      return 'general'; // Fallback profession
    }
  }

  async storeFirstDMTemplate(data: {
    campaign: string;
    profession: string;
    dmText: string;
    embedding?: number[];
  }): Promise<void> {
    try {
      // Generate embedding if not provided
      const embedding = data.embedding || await this.generateEmbedding(`${data.profession} ${data.campaign} ${data.dmText}`);
      
      console.log('Storing first DM template:', {
        campaign: data.campaign,
        profession: data.profession,
        dmTextLength: data.dmText.length,
        embeddingLength: embedding.length,
      });
      
      // Store in first_dm_templates table
      const { error } = await this.supabase
        .from('first_dm_templates')
        .insert({
          campaign: data.campaign,
          profession: data.profession,
          dm_text: data.dmText,
          embedding: embedding
        });

      if (error) {
        console.error('Error storing first DM template:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('First DM template stored successfully');
    } catch (error) {
      console.error('Error storing first DM template:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService(); 