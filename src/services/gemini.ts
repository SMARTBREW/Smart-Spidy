import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyAohVF3McHbdGS_BT2rbfYY0yFxoQz3ZHI';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const enhancedPrompt = `${prompt}

IMPORTANT: When emphasizing important words or phrases, use Unicode bold characters (𝐰𝐨𝐫𝐝) instead of markdown **bold** or "quotes" for emphasis.`;
      
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      let text = response.text();
      
      // Convert any remaining markdown bold to Unicode bold
      text = text.replace(/\*\*(.*?)\*\*/g, (match: string, text: string) => {
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
      
      return text;
    } catch (error: any) {
      console.error('Error generating response:', error);
      
      // More specific error messages
      if (error.message?.includes('404')) {
        throw new Error('AI model not found. Please check the configuration.');
      } else if (error.message?.includes('403')) {
        throw new Error('API key authentication failed. Please check your API key.');
      } else if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else {
        throw new Error('Failed to generate response. Please try again.');
      }
    }
  }

  async generateChatResponse(messages: Array<{ role: string; content: string }>, newMessage: string): Promise<string> {
    try {
      // If we have previous messages, include them for context
      let prompt = newMessage;
      if (messages.length > 0) {
        // Only include the last few messages to avoid token limits
        const recentMessages = messages.slice(-6); // Last 6 messages for context
        const conversation = recentMessages.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');
        
        prompt = `Previous conversation:\n${conversation}\n\nUser: ${newMessage}\n\nPlease respond as a helpful AI assistant. When emphasizing important words or phrases, use Unicode bold characters (𝐰𝐨𝐫𝐝) instead of markdown **bold** or "quotes" for emphasis.`;
      }
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Convert any remaining markdown bold to Unicode bold
      text = text.replace(/\*\*(.*?)\*\*/g, (match: string, text: string) => {
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
      
      return text;
    } catch (error) {
      console.error('Error generating chat response:', error);
      // Fallback to simple generation if context fails
      return await this.generateResponse(newMessage);
    }
  }

  async classifyStatus(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error: any) {
      console.error('Error classifying chat status:', error);
      throw new Error('Failed to classify chat status.');
    }
  }
}

export const geminiService = new GeminiService(); 