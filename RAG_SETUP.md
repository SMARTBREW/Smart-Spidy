# SmartSpidy RAG System Setup Guide

## Overview

This guide covers the complete setup and usage of the SmartSpidy RAG (Retrieval-Augmented Generation) system, which combines OpenAI GPT-4o with Supabase vector search for context-aware responses.

## Architecture

```
User Query → OpenAI Embeddings → Supabase Vector Search → Context Retrieval → GPT-4o Response
```

## Prerequisites

1. **OpenAI API Key** - With access to GPT-4o and text-embedding-3-large
2. **Supabase Project** - With pgvector extension enabled
3. **Node.js** - Version 18 or higher
4. **Knowledge Base** - Populated `SmartSpidy_KnowledgeBase` table

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration  
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

### 1. Enable pgvector Extension

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Create Knowledge Base Table

```sql
-- Create the knowledge base table
CREATE TABLE SmartSpidy_KnowledgeBase (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    combined_text TEXT NOT NULL,
    smartspidy_chunk TEXT NOT NULL,
    smartspidy_embedding VECTOR(1536), -- text-embedding-3-small dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Create Vector Index

```sql
-- Create ivfflat index for cosine similarity
CREATE INDEX ON SmartSpidy_KnowledgeBase 
USING ivfflat (smartspidy_embedding vector_cosine_ops) 
WITH (lists = 100);
```

### 4. Create RPC Function

```sql
-- Create the match function for similarity search
CREATE OR REPLACE FUNCTION match_smartspidy_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    smartspidy_chunk TEXT,
    combined_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        SmartSpidy_KnowledgeBase.id,
        SmartSpidy_KnowledgeBase.smartspidy_chunk,
        SmartSpidy_KnowledgeBase.combined_text,
        (SmartSpidy_KnowledgeBase.smartspidy_embedding <=> query_embedding) * -1 + 1 AS similarity
    FROM SmartSpidy_KnowledgeBase
    WHERE (SmartSpidy_KnowledgeBase.smartspidy_embedding <=> query_embedding) * -1 + 1 > match_threshold
    ORDER BY SmartSpidy_KnowledgeBase.smartspidy_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

## Installation

1. **Install Dependencies**

```bash
npm install @supabase/supabase-js openai
```

2. **Verify Installation**

The following files should be created in your project:

```
src/
├── services/
│   ├── openai.ts          # OpenAI service with embeddings
│   ├── supabaseClient.ts  # Supabase client configuration
│   └── ragService.ts      # Main RAG pipeline
├── types/
│   └── index.ts           # TypeScript interfaces
└── utils/
    └── ragTest.ts         # Testing utilities
```

## Usage

### Basic RAG Query

```typescript
import { ragService } from './services/ragService';

// Get an answer using the RAG system
const response = await ragService.getSmartSpidyAnswer(
  "What are effective fundraising strategies for NGOs?"
);

console.log(response.answer);        // AI-generated answer
console.log(response.confidence);   // Confidence score (0-1)
console.log(response.sources);      // Retrieved knowledge base chunks
console.log(response.processingTime); // Processing time in ms
```

### Advanced Usage with Custom Parameters

```typescript
import { getSmartSpidyAnswer } from './services/ragService';

// Custom similarity threshold and result count
const response = await getSmartSpidyAnswer(
  "How can I improve donor engagement?",
  0.8,  // Higher similarity threshold
  10    // More results
);
```

### Integration with Chat System

The RAG system is automatically integrated with your existing chat functionality. When users send messages, the system:

1. Generates embeddings for the query
2. Searches the knowledge base for relevant chunks
3. Uses GPT-4o to generate contextual responses
4. Falls back to direct OpenAI if RAG fails

## Testing

### Console Testing

Open your browser's developer console and run:

```javascript
// Comprehensive health check
await window.ragTest.healthCheck();

// Test with sample queries
await window.ragTest.testQueries();

// Validate environment variables
window.ragTest.validateEnv();

// Get system information
window.ragTest.systemInfo();
```

### Programmatic Testing

```typescript
import { 
  performSystemHealthCheck, 
  testRAGWithSampleQueries 
} from './utils/ragTest';

// Run health check
const healthCheck = await performSystemHealthCheck();
console.log(healthCheck);

// Test with sample queries
await testRAGWithSampleQueries();
```

## Configuration

### RAG System Defaults

```typescript
const DEFAULT_CONFIG = {
  matchThreshold: 0.7,      // Minimum similarity score
  matchCount: 5,            // Number of chunks to retrieve
  embeddingModel: 'text-embedding-3-small',
  chatModel: 'gpt-4o',
  maxTokens: 1500,
  temperature: 0.7
};
```

### Customizing the System

```typescript
// Modify the RAG service configuration
const customResponse = await ragService.getSmartSpidyAnswer(
  query,
  0.8,  // Higher threshold for more relevant results
  3     // Fewer chunks for faster processing
);
```

## Error Handling

The system includes comprehensive error handling:

- **Embedding Errors**: Falls back to direct OpenAI chat
- **Search Errors**: Provides informative error messages
- **Generation Errors**: Attempts retry with simplified context
- **Validation Errors**: Clear feedback on missing requirements

## Performance Optimization

### Best Practices

1. **Chunk Size**: Keep chunks between 200-500 tokens
2. **Embedding Quality**: Use descriptive, well-structured text
3. **Index Maintenance**: Regularly update vector indices
4. **Caching**: Consider implementing response caching
5. **Batch Processing**: Process multiple queries efficiently

### Monitoring

```typescript
// Monitor RAG performance
const response = await ragService.getSmartSpidyAnswer(query);
console.log({
  confidence: response.confidence,
  sources: response.sources.length,
  processingTime: response.processingTime,
  avgSimilarity: response.sources.reduce((sum, s) => sum + s.similarity, 0) / response.sources.length
});
```

## Security Considerations

⚠️ **Important**: This implementation calls OpenAI directly from the frontend, which exposes your API key. For production use:

1. **Create a Backend API**: Move OpenAI calls to a secure backend
2. **Use Environment Variables**: Never commit API keys to version control
3. **Implement Rate Limiting**: Prevent API abuse
4. **Add Authentication**: Secure your endpoints

### Production Architecture

```
Frontend → Your Backend API → OpenAI API
                ↓
            Supabase (with RLS)
```

## Troubleshooting

### Common Issues

1. **"VITE_OPENAI_API_KEY is not defined"**
   - Check your `.env` file
   - Ensure variable names start with `VITE_`
   - Restart your development server

2. **"Supabase connection failed"**
   - Verify your Supabase URL and anon key
   - Check if pgvector extension is enabled
   - Ensure RPC function exists

3. **"No similar chunks found"**
   - Check if your knowledge base has data
   - Lower the similarity threshold
   - Verify embedding dimensions match

4. **"API quota exceeded"**
   - Check your OpenAI usage limits
   - Implement request throttling
   - Consider using a smaller embedding model

### Debug Mode

Enable detailed logging:

```typescript
// Enable debug mode in the console
localStorage.setItem('ragDebug', 'true');

// View detailed RAG processing logs
await ragService.getSmartSpidyAnswer("test query");
```

## Next Steps

1. **Populate Knowledge Base**: Add your NGO fundraising content
2. **Test Thoroughly**: Run comprehensive tests with real queries
3. **Monitor Performance**: Track response quality and speed
4. **Optimize Chunks**: Refine your content chunking strategy
5. **Implement Security**: Move to production-ready architecture

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Run the health check utility
3. Verify all environment variables are set
4. Test individual components (OpenAI, Supabase, RAG pipeline)

---

**SmartSpidy RAG System v1.0.0**  
*Powering intelligent NGO fundraising assistance* 