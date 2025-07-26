# Enhanced RAG Schema Documentation

## Overview
This document describes the enhanced RAG (Retrieval-Augmented Generation) implementation for Smart Spidy, featuring campaign-specific knowledge bases and improved contextual responses.

## Database Schema

### New Table: `smartspidy`
```sql
create table public.smartspidy (
  id uuid not null default gen_random_uuid (),
  combined_text text null,
  embedding public.vector null,
  campaign text null,
  created_at timestamp without time zone null default timezone ('utc'::text, now()),
  constraint smartspidy_pkey primary key (id)
) TABLESPACE pg_default;
```

### Index for Optimized Vector Search
```sql
create index IF not exists smartspidy_hnsw_cosine_idx on public.smartspidy using hnsw (embedding vector_cosine_ops)
with
  (m = '16', ef_construction = '64') TABLESPACE pg_default
where
  (campaign is not null);
```

### RPC Function for Campaign-Specific Search
```sql
create or replace function search_campaign_embeddings(
  query_embedding vector(1536),
  campaign_name text,
  match_threshold float default 0.75,
  match_count int default 5
)
returns table (
  id uuid,
  combined_text text,
  campaign text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    s.id,
    s.combined_text,
    s.campaign,
    1 - (s.embedding <=> query_embedding) as similarity
  from
    smartspidy s
  where
    s.campaign = campaign_name
  and
    (1 - (s.embedding <=> query_embedding)) > match_threshold
  order by
    s.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

## Campaign Mapping

### Product to Campaign Mapping
- `Pads For Freedom` → `Pads For Freedom`
- `Bowls Of Hope` → `Bowls Of Hope`
- `Wings Of Hope` → `Wings Of Hope`

### Valid Campaign Names
- `Pads For Freedom`
- `Bowls Of Hope`
- `Wings Of Hope`

## Implementation Architecture

### Enhanced RAG Flow
```
User Query → Campaign Detection → Campaign-Specific RAG → Enhanced Response
```

### Components Updated

#### 1. Frontend (`src/services/supabase.ts`)
- `getRelevantContext(query, campaign?)` - Campaign-aware context retrieval
- `getGenericContext()` - Fallback for non-campaign queries
- Uses `search_campaign_embeddings` RPC function

#### 2. Backend Services
- `backend/utils/campaignMapper.js` - Campaign mapping utilities
- `backend/services/openaiService.js` - Enhanced with campaign-aware RAG
- `backend/controllers/messageController.js` - Campaign detection and context passing

#### 3. Key Functions
- `getCampaignContext(query, campaign)` - Retrieves campaign-specific knowledge
- `generateOpenAIResponse(message, chatDetails)` - Enhanced with contextual awareness
- `mapProductToCampaign(product)` - Consistent campaign name mapping

## Benefits

### Performance Improvements
- **Faster searches** with campaign-scoped queries
- **Reduced noise** from irrelevant campaigns
- **HNSW index** for optimized vector similarity search
- **Cosine similarity** for better semantic matching

### Response Quality
- **Campaign-specific knowledge** and statistics
- **Contextually relevant** answers aligned with campaign goals
- **Consistent messaging** across campaign communications
- **Targeted responses** based on user's campaign context

### Scalability
- **Easy addition** of new campaigns
- **Isolated knowledge bases** per campaign
- **Targeted content management**
- **Campaign-specific analytics** potential

## Usage Examples

### Campaign-Specific Query
```javascript
// User asks about period poverty in a "Pads For Freedom" chat
// System automatically uses campaign-specific context
const context = await getCampaignContext(
  "What is period poverty?", 
  "Pads For Freedom"
);
```

### First DM Generation
```javascript
// System detects "First DM" request and campaign
const campaign = mapProductToCampaign(chatDetails.product); // "Pads For Freedom" → "Pads For Freedom"
const template = await getCampaignDM(profession, campaign);
```

### Enhanced Response Generation
```javascript
// Regular queries get campaign-aware context
const response = await generateOpenAIResponse(
  userMessage, 
  { product: "Pads For Freedom", profession: "Entrepreneur" }
);
```

## Migration Notes

### From Old Schema
- Replaces `smartspidy_embeddings` table
- Updates `match_smartspidy_chunks` RPC to `search_campaign_embeddings`
- Maintains backward compatibility with fallback mechanisms

### Data Population
- Campaign-specific content needs to be embedded and stored
- Each campaign should have dedicated knowledge base entries
- Embeddings should be generated using `text-embedding-ada-002` model

## Configuration

### Environment Variables
- `OPENAI_API_KEY` - Required for embeddings and completions
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_SERVICE_KEY` - Service role key for database access

### Default Settings
- **Match threshold**: 0.75 for campaign-specific searches
- **Match count**: 5 results per query
- **Default campaign**: "Pads For Freedom"
- **Embedding model**: text-embedding-ada-002
- **Chat model**: gpt-4o

## Testing

### Campaign DM Testing
1. Create chat with specific profession and product
2. Request "First DM" 
3. Verify campaign-specific template retrieval
4. Check placeholder replacement with actual names

### RAG Testing
1. Ask campaign-specific questions
2. Verify context comes from correct campaign
3. Test fallback to generic search
4. Validate response quality and relevance

## Monitoring

### Key Metrics to Track
- Campaign-specific context retrieval success rate
- Response relevance scores
- Query processing time
- Embedding generation performance
- Campaign coverage in knowledge base 