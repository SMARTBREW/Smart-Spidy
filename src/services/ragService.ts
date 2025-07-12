import { openaiService } from './openai';
import { matchSmartSpidyChunks, MatchSmartSpidyChunksResult } from './supabaseClient';

export interface RAGResponse {
  answer: string;
  sources: MatchSmartSpidyChunksResult[];
  confidence: number;
  processingTime: number;
}

export interface RAGError {
  message: string;
  type: 'embedding' | 'search' | 'generation' | 'unknown';
  details?: any;
}

class RAGService {
  private readonly DEFAULT_MATCH_THRESHOLD = 0.7;
  private readonly DEFAULT_MATCH_COUNT = 5;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.5;

  /**
   * Main RAG function that processes a user query and returns a contextual answer
   * @param userQuery - The user's question or query
   * @param matchThreshold - Minimum similarity threshold for vector search (0-1)
   * @param matchCount - Number of similar chunks to retrieve
   * @returns Promise<RAGResponse> - The AI-generated answer with sources and metadata
   */
  async getSmartSpidyAnswer(
    userQuery: string,
    matchThreshold: number = this.DEFAULT_MATCH_THRESHOLD,
    matchCount: number = this.DEFAULT_MATCH_COUNT
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Validate input
      if (!userQuery || userQuery.trim().length === 0) {
        throw new Error('User query cannot be empty');
      }

      // Step 2: Generate embedding for the user query
      console.log('🔍 Generating embedding for query:', userQuery);
      const queryEmbedding = await this.generateQueryEmbedding(userQuery);

      // Step 3: Search for similar chunks in Supabase
      console.log('🔎 Searching for similar chunks in knowledge base...');
      const similarChunks = await this.searchSimilarChunks(
        queryEmbedding,
        matchThreshold,
        matchCount
      );

      // Step 4: Check if we have enough relevant context
      if (similarChunks.length === 0) {
        return {
          answer: "I couldn't find relevant information in my knowledge base to answer your question. Please try rephrasing your question or ask about NGO fundraising campaigns, which is my area of expertise.",
          sources: [],
          confidence: 0,
          processingTime: Date.now() - startTime
        };
      }

      // Step 5: Calculate confidence based on similarity scores
      const confidence = this.calculateConfidence(similarChunks);

      // Step 6: Build context from retrieved chunks
      const context = this.buildContext(similarChunks);

      // Step 7: Generate AI response using context
      console.log('🤖 Generating contextual response...');
      const answer = await this.generateContextualAnswer(context, userQuery);

      const processingTime = Date.now() - startTime;
      console.log(`✅ RAG processing completed in ${processingTime}ms`);

      return {
        answer,
        sources: similarChunks,
        confidence,
        processingTime
      };

    } catch (error) {
      console.error('❌ RAG processing failed:', error);
      throw this.handleRAGError(error);
    }
  }

  /**
   * Generate embedding for user query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      return await openaiService.generateEmbedding(query);
    } catch (error) {
      throw {
        message: 'Failed to generate embedding for query',
        type: 'embedding',
        details: error
      } as RAGError;
    }
  }

  /**
   * Search for similar chunks in the knowledge base
   */
  private async searchSimilarChunks(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number
  ): Promise<MatchSmartSpidyChunksResult[]> {
    try {
      return await matchSmartSpidyChunks(queryEmbedding, matchThreshold, matchCount);
    } catch (error) {
      throw {
        message: 'Failed to search knowledge base',
        type: 'search',
        details: error
      } as RAGError;
    }
  }

  /**
   * Calculate confidence score based on similarity scores of retrieved chunks
   */
  private calculateConfidence(chunks: MatchSmartSpidyChunksResult[]): number {
    if (chunks.length === 0) return 0;

    // Calculate weighted average of similarity scores
    const totalSimilarity = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0);
    const averageSimilarity = totalSimilarity / chunks.length;

    // Normalize to 0-1 scale and apply confidence curve
    const confidence = Math.min(1, Math.max(0, averageSimilarity));
    
    // Apply confidence curve to make the score more meaningful
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Build context string from retrieved chunks
   */
  private buildContext(chunks: MatchSmartSpidyChunksResult[]): string {
    if (chunks.length === 0) return '';

    const contextParts = chunks.map((chunk, index) => {
      return `[Source ${index + 1}] (Similarity: ${(chunk.similarity * 100).toFixed(1)}%)\n${chunk.smartspidy_chunk}`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Generate contextual answer using OpenAI
   */
  private async generateContextualAnswer(context: string, query: string): Promise<string> {
    try {
      return await openaiService.generateContextualResponse(context, query);
    } catch (error) {
      throw {
        message: 'Failed to generate AI response',
        type: 'generation',
        details: error
      } as RAGError;
    }
  }

  /**
   * Handle and standardize RAG errors
   */
  private handleRAGError(error: any): RAGError {
    if (error.type) {
      return error as RAGError;
    }

    return {
      message: error.message || 'An unknown error occurred during RAG processing',
      type: 'unknown',
      details: error
    };
  }

  /**
   * Utility method to test the RAG pipeline with a sample query
   */
  async testRAGPipeline(testQuery: string = "What are effective fundraising strategies for NGOs?"): Promise<RAGResponse> {
    console.log('🧪 Testing RAG pipeline with query:', testQuery);
    return await this.getSmartSpidyAnswer(testQuery);
  }

  /**
   * Get system status and configuration
   */
  getSystemInfo(): object {
    return {
      defaultMatchThreshold: this.DEFAULT_MATCH_THRESHOLD,
      defaultMatchCount: this.DEFAULT_MATCH_COUNT,
      minConfidenceThreshold: this.MIN_CONFIDENCE_THRESHOLD,
      embeddingModel: 'text-embedding-3-small',
      chatModel: 'gpt-4o',
      version: '1.0.0'
    };
  }
}

// Export singleton instance
export const ragService = new RAGService();

// Export utility functions for direct use
export const getSmartSpidyAnswer = ragService.getSmartSpidyAnswer.bind(ragService);
export const testRAGPipeline = ragService.testRAGPipeline.bind(ragService); 