-- Run this once in the Supabase SQL editor.
create extension if not exists vector;

-- Entitlements: one row per user. tier = public | enrolled | paid
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'public' check (tier in ('public','enrolled','paid'))
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  source_path text unique not null,
  title text not null,
  url text,
  content_type text default 'lesson',
  access_level text not null default 'public' check (access_level in ('public','enrolled','paid')),
  content_hash text not null,
  updated_at timestamptz default now()
);

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  section_path text,
  content text not null,
  access_level text not null default 'public',
  embedding vector(1024) not null,           -- voyage-3.5 default dimension
  fts tsvector generated always as (to_tsvector('english', content)) stored
);

create index if not exists chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops);
create index if not exists chunks_fts_idx on chunks using gin (fts);
create index if not exists chunks_doc_idx on chunks (document_id);

create table if not exists chat_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  question text,
  rewritten_query text,
  chunk_ids uuid[],
  answer text,
  latency_ms int,
  feedback smallint
);

-- Row Level Security: the API uses the service role (bypasses RLS), but these
-- policies protect the data if you ever query with the anon/authenticated keys.
alter table documents enable row level security;
alter table chunks enable row level security;
alter table profiles enable row level security;
alter table chat_logs enable row level security;

create or replace function user_levels() returns text[]
language sql stable security definer set search_path = public as $$
  select case coalesce((select tier from profiles where id = auth.uid()), 'public')
    when 'paid' then array['public','enrolled','paid']
    when 'enrolled' then array['public','enrolled']
    else array['public']
  end
$$;

create policy "read allowed chunks" on chunks for select using (access_level = any(user_levels()));
create policy "read allowed documents" on documents for select using (access_level = any(user_levels()));
create policy "read own profile" on profiles for select using (id = auth.uid());

-- Hybrid search: vector similarity + keyword match, fused with Reciprocal Rank Fusion.
create or replace function hybrid_search(
  query_text text,
  query_embedding vector(1024),
  match_count int default 30,
  allowed_levels text[] default array['public'],
  rrf_k int default 60
)
returns table (
  id uuid, content text, section_path text,
  title text, url text, content_type text, score float
)
language sql stable as $$
  with semantic as (
    select c.id, row_number() over (order by c.embedding <=> query_embedding) as rank
    from chunks c
    where c.access_level = any(allowed_levels)
    order by c.embedding <=> query_embedding
    limit match_count * 2
  ),
  keyword as (
    select c.id, row_number() over (order by ts_rank_cd(c.fts, to_tsquery('english', query_text)) desc) as rank
    from chunks c
    where query_text <> ''
      and c.access_level = any(allowed_levels)
      and c.fts @@ to_tsquery('english', query_text)
    order by ts_rank_cd(c.fts, to_tsquery('english', query_text)) desc
    limit match_count * 2
  ),
  fused as (
    select coalesce(s.id, k.id) as id,
           coalesce(1.0 / (rrf_k + s.rank), 0) + coalesce(1.0 / (rrf_k + k.rank), 0) as score
    from semantic s full outer join keyword k on s.id = k.id
  )
  select c.id, c.content, c.section_path, d.title, d.url, d.content_type, f.score::float
  from fused f
  join chunks c on c.id = f.id
  join documents d on d.id = c.document_id
  order by f.score desc
  limit match_count;
$$;
