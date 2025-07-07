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
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
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
        
        prompt = `Previous conversation:\n${conversation}\n\nUser: ${newMessage}\n\nPlease respond as a helpful AI assistant. When emphasizing a word, use double quotes ("word") instead of markdown's bold ( **word** ).`;
      }
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error('Error generating chat response:', error);
      // Fallback to simple generation if context fails
      return await this.generateResponse(newMessage);
    }
  }
}

export const geminiService = new GeminiService(); 