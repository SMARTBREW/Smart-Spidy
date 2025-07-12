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
      const enhancedPrompt = relevantContext 
        ? `You are SmartSpidy AI Assistant.

Use the following context to answer the user's query. Be precise and helpful.

Context:
${relevantContext}

User Query:
${prompt}`
        : prompt;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || 'No response generated';

      // Store training data for future learning (optional)
      // Temporarily disabled to debug storage issues
      /*
      if (relevantContext) {
        try {
          await supabaseService.storeTrainingData({
            userQuestion: prompt,
            assistantAnswer: response
          });
        } catch (error) {
          console.warn('Failed to store training data:', error);
        }
      }
      */

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