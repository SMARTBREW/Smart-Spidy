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

  async getRelevantContext(query: string, campaign?: string): Promise<string> {
    try {
      console.log('Getting relevant context for query:', query, 'campaign:', campaign);
      
      // First, generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      console.log('Generated embedding, length:', queryEmbedding.length);
      
      if (campaign) {
        // Use campaign-specific search with the new schema
        console.log('Calling search_campaign_embeddings RPC...');
        const { data, error } = await this.supabase.rpc("search_campaign_embeddings", {
          query_embedding: queryEmbedding,
          campaign_name: campaign,
          match_threshold: 0.52,
          match_count: 5
        });

        if (error) {
          console.error('Campaign-specific search error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          // Fallback to generic search if campaign-specific fails
          return this.getGenericContext(queryEmbedding);
        }

        console.log('Campaign-specific RPC call successful, data:', data);
        
        if (data && data.length > 0) {
          const context = data.map((item: any) => item.combined_text).join("\n---\n");
          console.log('Found campaign-specific context, length:', context.length);
          console.log('Context preview:', context.substring(0, 200) + '...');
          return context;
        } else {
          console.log('No campaign-specific context found, falling back to generic search');
          return this.getGenericContext(queryEmbedding);
        }
      } else {
        // Fallback to generic search when no campaign specified
        return this.getGenericContext(queryEmbedding);
      }
    } catch (error) {
      console.error('Error getting relevant context:', error);
      return '';
    }
  }

  private async getGenericContext(queryEmbedding: number[]): Promise<string> {
    try {
      console.log('Performing generic embedding search...');
      
      // Search the new smartspidy table without campaign filter using the enhanced function
      const { data, error } = await this.supabase.rpc("search_all_embeddings", {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5
      });

      if (error) {
        console.error('Generic search error:', error);
        return '';
      }

      if (data && data.length > 0) {
        const context = data.map((item: any) => item.combined_text).join("\n---\n");
        console.log('Found generic context, length:', context.length);
        return context;
      } else {
        console.log('No relevant context found in database');
        return '';
      }
    } catch (error) {
      console.error('Error in generic search:', error);
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
          model: "text-embedding-3-small" // Using text-embedding-3-small as requested by user
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

  async getCampaignDM(profession: string, campaign: string = 'pads for freedom'): Promise<any> {
    try {
      console.log('Getting campaign DM for profession:', profession, 'campaign:', campaign);
      
      // First, try direct text search for exact profession match
      console.log('Trying direct profession match...');
      const { data: directMatch, error: directError } = await this.supabase
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
        const { data: variantMatch, error: variantError } = await this.supabase
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

      // If no matches found, return a default fallback
      console.log('No campaign DM found for profession:', profession, 'campaign:', campaign);
      return null;
    } catch (error) {
      console.error('Error getting campaign DM:', error);
      return null;
    }
  }

  // Helper function to replace template placeholders with dynamic values
  replaceDMTemplate(template: string, chatName: string, volunteerName: string = 'Smart Spidy Team'): string {
    try {
      return template
        .replace(/\{Name\}/g, chatName)
        .replace(/\{Volunteer Name\}/g, volunteerName);
    } catch (error) {
      console.error('Error replacing DM template:', error);
      return template;
    }
  }

  // Get user name by ID
  async getUserName(userId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user name:', error);
        return 'Smart Spidy Team';
      }

      return data?.name || 'Smart Spidy Team';
    } catch (error) {
      console.error('Error getting user name:', error);
      return 'Smart Spidy Team';
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