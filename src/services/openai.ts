import OpenAI from 'openai';
import { supabaseService } from './supabase';

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
      // Get relevant context from Supabase vector database
      const relevantContext = await supabaseService.getRelevantContext(prompt);
      
      // Create enhanced prompt with context
      let systemPrompt = "You are SmartSpidy AI Assistant, a helpful and knowledgeable AI that provides accurate and relevant information.";
      
      let messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      if (relevantContext) {
        // Add context as a system message
        messages.push({
          role: 'system',
          content: `Here's some relevant context from the knowledge base to help answer the user's query:

${relevantContext}

Use this context to provide a comprehensive and accurate response. If the context doesn't contain relevant information for the user's query, use your general knowledge while mentioning that you don't have specific information about that topic in the knowledge base.`
        });
      }

      // Add user query
      messages.push({
        role: 'user',
        content: prompt
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o as preferred by the user
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || 'No response generated';

      // Store successful interactions for future learning (optional)
      if (relevantContext && response) {
        try {
          await supabaseService.storeKnowledgeData({
            combinedText: `Q: ${prompt}\nA: ${response}`,
            smartspidyChunk: prompt
          });
        } catch (error) {
          console.warn('Failed to store knowledge data:', error);
        }
      }

      return response;
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
  async classifyStatus(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0
      });
      return completion.choices[0]?.message?.content || 'green';
    } catch (error) {
      console.error('Error classifying chat status:', error);
      throw new Error('Failed to classify chat status.');
    }
  }
}

export const openaiService = new OpenAIService(); 