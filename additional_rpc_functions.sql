-- Additional RPC function for generic searches across all campaigns
create or replace function search_all_embeddings(
  query_embedding vector(1536),
  match_threshold float default 0.5,
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
    s.embedding is not null
  and
    (1 - (s.embedding <=> query_embedding)) > match_threshold
  order by
    s.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Enhanced campaign search function that handles null campaign names
create or replace function search_campaign_embeddings_enhanced(
  query_embedding vector(1536),
  campaign_name text default null,
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
  if campaign_name is null then
    -- Search across all campaigns if no specific campaign provided
    return query
    select
      s.id,
      s.combined_text,
      s.campaign,
      1 - (s.embedding <=> query_embedding) as similarity
    from
      smartspidy s
    where
      s.embedding is not null
    and
      (1 - (s.embedding <=> query_embedding)) > (match_threshold - 0.25) -- Lower threshold for generic search
    order by
      s.embedding <=> query_embedding
    limit match_count;
  else
    -- Search within specific campaign
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
      s.embedding is not null
    and
      (1 - (s.embedding <=> query_embedding)) > match_threshold
    order by
      s.embedding <=> query_embedding
    limit match_count;
  end if;
end;
$$; 