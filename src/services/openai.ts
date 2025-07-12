import OpenAI from 'openai';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error('VITE_OPENAI_API_KEY is not defined in environment variables');
}

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, API calls should be made from backend
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error: any) {
      console.error('Error generating response:', error);
      
      // More specific error messages
      if (error.message?.includes('401')) {
        throw new Error('API key authentication failed. Please check your API key.');
      } else if (error.message?.includes('429')) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else {
        throw new Error('Failed to generate response. Please try again.');
      }
    }
  }

  async generateChatResponse(messages: Array<{ role: string; content: string }>, newMessage: string): Promise<string> {
    try {
      // Convert messages to OpenAI format
      const openaiMessages = messages.map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      }));

      // Add the new message
      openaiMessages.push({
        role: 'user' as const,
        content: newMessage
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Error generating chat response:', error);
      // Fallback to simple generation if context fails
      return await this.generateResponse(newMessage);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });

      return response.data[0]?.embedding || [];
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      
      // More specific error messages
      if (error.message?.includes('401')) {
        throw new Error('API key authentication failed. Please check your API key.');
      } else if (error.message?.includes('429')) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else {
        throw new Error('Failed to generate embedding. Please try again.');
      }
    }
  }

  async generateContextualResponse(context: string, query: string): Promise<string> {
    try {
      const prompt = `You are SmartSpidy, a personalized assistant for NGO fundraising campaigns. Use the provided context to answer the user's question accurately and helpfully.

Context:
${context}

User Question: ${query}

Please provide a comprehensive answer based on the context provided. If the context doesn't contain enough information to fully answer the question, mention what information is available and suggest what additional details might be needed.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are SmartSpidy, a knowledgeable assistant specializing in NGO fundraising campaigns. Provide helpful, accurate, and actionable advice based on the context provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Error generating contextual response:', error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService(); 