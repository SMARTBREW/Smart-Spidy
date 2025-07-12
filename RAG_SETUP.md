# SmartSpidy RAG Pipeline Setup

This document explains how to set up the hybrid RAG (Retrieval-Augmented Generation) pipeline for SmartSpidy.

## Overview

The RAG pipeline combines:
1. **Vector similarity search** from Supabase to retrieve relevant context
2. **OpenAI GPT-4** for generating contextual responses

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# Optional: Adjust RAG settings
VITE_MATCH_THRESHOLD=0.75
VITE_MATCH_COUNT=5
```

## Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and service role key

### 2. Enable Vector Extension
Run this SQL in your Supabase SQL editor:

```sql
-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the embeddings table
CREATE TABLE IF NOT EXISTS public.smartspidy_embeddings (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for similarity search
CREATE INDEX IF NOT EXISTS smartspidy_embeddings_embedding_idx 
ON public.smartspidy_embeddings 
USING hnsw (embedding vector_l2_ops);

-- Create the similarity search function
CREATE OR REPLACE FUNCTION match_smartspidy_embeddings(
  query_embedding vector(1536),
  match_count int
)
RETURNS TABLE(
  id bigint,
  text text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id,
    text,
    1 - (embedding <=> query_embedding) as similarity
  FROM public.smartspidy_embeddings
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### 3. Training Data Table
Note: The system uses the `smartspidy_embeddings` table for both embeddings and training data. No separate training data table is needed.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Start the development server:
```bash
npm run dev
```

## How It Works

1. **User Query**: When a user asks a question, the system:
   - Generates an embedding for the query using OpenAI's text-embedding-3-small model
   - Searches for similar embeddings in Supabase using cosine similarity
   - Retrieves relevant context from the database

2. **Response Generation**: The system:
   - Combines the user query with retrieved context
   - Sends the enhanced prompt to OpenAI GPT-4
   - Returns a contextual response

3. **Learning**: The system optionally stores:
   - User questions and assistant answers
   - Embeddings for future retrieval
   - Metadata for analysis

## Configuration

You can adjust the RAG behavior by modifying these parameters in `src/services/supabase.ts`:

- `match_threshold`: Minimum similarity score (0.0 to 1.0)
- `match_count`: Number of context pieces to retrieve
- `max_tokens`: Maximum response length
- `temperature`: Response creativity (0.0 to 1.0)

## Adding Knowledge

To add knowledge to your vector database:

1. **Manual Entry**: Use the Supabase dashboard to insert embeddings
2. **Bulk Import**: Create a script to process documents and insert embeddings
3. **API Integration**: Use the `storeTrainingData` function in your application

## Troubleshooting

### Common Issues:

1. **"Supabase environment variables are not defined"**
   - Check your `.env` file exists and has correct values

2. **"API key authentication failed"**
   - Verify your OpenAI API key is valid and has sufficient credits

3. **"Supabase search error"**
   - Ensure the `match_smartspidy_embeddings` function exists in your database
   - Check that your service role key has the necessary permissions

4. **No relevant context found**
   - Lower the `match_threshold` value
   - Add more knowledge to your vector database
   - Check that embeddings are being generated correctly

## Performance Tips

1. **Index Optimization**: Ensure your vector index is properly configured
2. **Batch Operations**: Group multiple embedding operations when possible
3. **Caching**: Consider caching frequently accessed embeddings
4. **Monitoring**: Monitor API usage and costs

## Security Notes

- Never expose your service role key in client-side code in production
- Consider implementing a backend API for sensitive operations
- Use row-level security (RLS) policies in Supabase
- Regularly rotate API keys 