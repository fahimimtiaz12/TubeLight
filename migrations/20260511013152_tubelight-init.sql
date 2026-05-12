create extension if not exists vector;

create table public.tubelight_document_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  storage_key text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz not null default now()
);

create table public.tubelight_chunks (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source_id uuid not null references public.tubelight_document_sources (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index tubelight_chunks_embedding_hnsw
  on public.tubelight_chunks using hnsw (embedding vector_cosine_ops);

create index tubelight_chunks_user_id_idx on public.tubelight_chunks (user_id);
create index tubelight_chunks_source_id_idx on public.tubelight_chunks (source_id);

create table public.tubelight_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  model_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tubelight_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.tubelight_chats (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index tubelight_messages_chat_id_idx on public.tubelight_messages (chat_id, created_at);

create or replace function public.match_tubelight_chunks(
  query_embedding vector(1536),
  match_count int default 8,
  match_threshold float default 0.72
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
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function public.match_tubelight_chunks(vector(1536), int, float) from public;
grant execute on function public.match_tubelight_chunks(vector(1536), int, float) to authenticated;

alter table public.tubelight_document_sources enable row level security;
alter table public.tubelight_chunks enable row level security;
alter table public.tubelight_chats enable row level security;
alter table public.tubelight_messages enable row level security;

create policy tubelight_sources_select on public.tubelight_document_sources
  for select to authenticated using (user_id = auth.uid());

create policy tubelight_sources_insert on public.tubelight_document_sources
  for insert to authenticated with check (user_id = auth.uid());

create policy tubelight_sources_update on public.tubelight_document_sources
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy tubelight_sources_delete on public.tubelight_document_sources
  for delete to authenticated using (user_id = auth.uid());

create policy tubelight_chunks_select on public.tubelight_chunks
  for select to authenticated using (user_id = auth.uid());

create policy tubelight_chunks_insert on public.tubelight_chunks
  for insert to authenticated with check (user_id = auth.uid());

create policy tubelight_chunks_update on public.tubelight_chunks
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy tubelight_chunks_delete on public.tubelight_chunks
  for delete to authenticated using (user_id = auth.uid());

create policy tubelight_chats_all on public.tubelight_chats
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy tubelight_messages_all on public.tubelight_messages
  for all to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.tubelight_chats c
      where c.id = chat_id and c.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tubelight_chats c
      where c.id = chat_id and c.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.tubelight_document_sources to authenticated;
grant select, insert, update, delete on public.tubelight_chunks to authenticated;
grant select, insert, update, delete on public.tubelight_chats to authenticated;
grant select, insert, update, delete on public.tubelight_messages to authenticated;

grant usage, select on sequence public.tubelight_chunks_id_seq to authenticated;
