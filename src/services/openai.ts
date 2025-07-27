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

  private convertMarkdownBoldToUnicode(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, (match, text) => {
      const boldMap = {
        'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
        'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗',
        ' ': ' '
      };
      
      return text.split('').map((char: string) => {
        return (boldMap as Record<string, string>)[char] || char;
      }).join('');
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      // Get relevant context from Supabase vector database
      const relevantContext = await supabaseService.getRelevantContext(prompt);
      
      // Create enhanced prompt with context
      let systemPrompt = `You are SmartSpidy AI Assistant, a helpful and knowledgeable AI that provides accurate and relevant information.

IMPORTANT FORMATTING INSTRUCTIONS:
- When emphasizing important words or phrases, use Unicode bold characters instead of markdown bold
- Replace **word** with 𝐰𝐨𝐫𝐝 (Unicode bold characters)
- Use 𝐔𝐧𝐢𝐜𝐨𝐝𝐞 𝐛𝐨𝐥𝐝 𝐜𝐡𝐚𝐫𝐚𝐜𝐭𝐞𝐫𝐬 for natural emphasis on key terms, concepts, or important information
- Do NOT use markdown **bold** or *italic* formatting
- Do NOT use "quotes" for emphasis
- Apply Unicode bold to words that deserve emphasis based on context and importance
- Do not hardcode specific words - let the context guide what should be emphasized`;
      
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

Use this context to provide a comprehensive and accurate response. If the context doesn't contain relevant information for the user's query, use your general knowledge while mentioning that you don't have specific information about that topic in the knowledge base.

Remember to use Unicode bold characters (𝐰𝐨𝐫𝐝) instead of markdown **bold** or "quotes" for emphasis.`
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

      let response = completion.choices[0]?.message?.content || 'No response generated';
      
      // Convert any remaining markdown bold to Unicode bold
      response = response.replace(/\*\*(.*?)\*\*/g, (match, text) => {
        return text.split('').map((char: string) => {
          const code = char.charCodeAt(0);
          if (code >= 97 && code <= 122) { // lowercase a-z
            return String.fromCharCode(code - 97 + 120205); // 𝐚-𝐳
          } else if (code >= 65 && code <= 90) { // uppercase A-Z
            return String.fromCharCode(code - 65 + 120211); // 𝐀-𝐙
          } else if (code >= 48 && code <= 57) { // 0-9
            return String.fromCharCode(code - 48 + 120816); // 𝟎-𝟗
          } else if (code === 32) { // space
            return ' ';
          }
          return char;
        }).join('');
      });

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

      let response = completion.choices[0]?.message?.content || 'No response generated';
      
      // Convert any remaining markdown bold to Unicode bold
      response = response.replace(/\*\*(.*?)\*\*/g, (match, text) => {
        return text.split('').map((char: string) => {
          const code = char.charCodeAt(0);
          if (code >= 97 && code <= 122) { // lowercase a-z
            return String.fromCharCode(code - 97 + 120205); // 𝐚-𝐳
          } else if (code >= 65 && code <= 90) { // uppercase A-Z
            return String.fromCharCode(code - 65 + 120211); // 𝐀-𝐙
          } else if (code >= 48 && code <= 57) { // 0-9
            return String.fromCharCode(code - 48 + 120816); // 𝟎-𝟗
          } else if (code === 32) { // space
            return ' ';
          }
          return char;
        }).join('');
      });
      
      return response;
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