-- Nearest-neighbor retrieval without a similarity floor (for short / meta questions
-- like "who is the author?" that often score low against dense textbook chunks).

create or replace function public.match_tubelight_chunks_nearest(
  query_embedding vector(1536),
  match_count int default 20
)
returns table (
  id bigint,
  content text,
  similarity float,
  source_id uuid,
  filename text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.source_id,
    s.filename
  from public.tubelight_chunks c
  join public.tubelight_document_sources s on s.id = c.source_id
  where c.user_id = auth.uid()
    and s.user_id = auth.uid()
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function public.match_tubelight_chunks_nearest(vector(1536), int) from public;
grant execute on function public.match_tubelight_chunks_nearest(vector(1536), int) to authenticated;
