-- ===================================================================
-- Blog modernisation — additive only. Safe to run more than once.
--
-- Adds the SEO + publishing columns required by the reference design.
-- Nothing is dropped, so existing posts keep working.
--
-- Run this once in Supabase Studio > SQL Editor.
-- Until it is run the site falls back to the legacy columns by itself.
-- ===================================================================

alter table public.blog_posts add column if not exists meta_title text;
alter table public.blog_posts add column if not exists meta_description text;
alter table public.blog_posts add column if not exists body text;
alter table public.blog_posts add column if not exists author text;
alter table public.blog_posts add column if not exists published boolean;
alter table public.blog_posts add column if not exists published_at date;

-- Every existing post is treated as published and gets a publish date.
update public.blog_posts
set published = true
where published is null;

update public.blog_posts
set published_at = date
where published_at is null and date is not null;

-- Author default for rows written before this migration.
update public.blog_posts
set author = 'Sakshi Gill'
where author is null or author = '';

-- Mirror legacy columns into the new ones for older rows.
update public.blog_posts
set meta_description = excerpt
where meta_description is null and excerpt is not null;

update public.blog_posts
set body = content
where body is null and content is not null;

update public.blog_posts
set meta_title = title
where meta_title is null and title is not null;

-- Slug must be unique and present.
create unique index if not exists blog_posts_slug_unique on public.blog_posts (slug);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc);

-- Default for new rows.
alter table public.blog_posts alter column published set default true;
alter table public.blog_posts alter column author set default 'Sakshi Gill';

-- ===================================================================
-- Row Level Security: the public blog is read-only, and only sees
-- published posts. Writes stay limited to signed-in admins.
-- ===================================================================

alter table public.blog_posts enable row level security;

drop policy if exists "blog public read" on public.blog_posts;
drop policy if exists "Public read blog posts" on public.blog_posts;
drop policy if exists "blog_posts_select_public" on public.blog_posts;

create policy "blog_posts_select_published"
  on public.blog_posts
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists "blog authenticated insert" on public.blog_posts;
drop policy if exists "blog authenticated update" on public.blog_posts;
drop policy if exists "blog authenticated delete" on public.blog_posts;

create policy "blog_posts_insert_admin"
  on public.blog_posts
  for insert
  to authenticated
  with check (true);

create policy "blog_posts_update_admin"
  on public.blog_posts
  for update
  to authenticated
  using (true)
  with check (true);

create policy "blog_posts_delete_admin"
  on public.blog_posts
  for delete
  to authenticated
  using (true);