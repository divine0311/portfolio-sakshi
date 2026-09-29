-- =============================================================================
-- Sakshi Gill — Portfolio CMS schema
-- Run this ONCE in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / ON CONFLICT).
--
-- ⚠️ This file is NOT complete on its own. The public #connect form writes to
-- public.contact_messages, which is created by schema-contact.sql. Run that
-- file too (same place, separate query), or the form cannot save anything.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. site_content — single editable row (id is pinned to 'main' by a CHECK)
-- -----------------------------------------------------------------------------
create table if not exists public.site_content (
  id                     text primary key default 'main' check (id = 'main'),
  hero_name              text        not null default '',
  hero_roles             jsonb       not null default '[]'::jsonb,
  hero_tagline           text        not null default '',
  who_am_i_story         text        not null default '',
  qualification_1_title  text        not null default '',
  qualification_1_desc   text        not null default '',
  qualification_1_timing text        not null default '',
  qualification_2_title  text        not null default '',
  qualification_2_desc   text        not null default '',
  qualification_2_timing text        not null default '',
  qualification_3_title  text        not null default '',
  qualification_3_desc   text        not null default '',
  qualification_3_timing text        not null default '',
  journey_quotes         jsonb       not null default '[]'::jsonb,
  contact_email          text        not null default '',
  contact_phone          text        not null default '',
  contact_linkedin       text        not null default '',
  updated_at             timestamptz not null default now()
);

comment on table public.site_content is 'Single-row table (id = ''main'') holding all editable portfolio copy.';

-- -----------------------------------------------------------------------------
-- 2. capabilities — one row per capability box, tools is a JSON array of
--    { "name": "ChatGPT", "icon": "chat" }
-- -----------------------------------------------------------------------------
create table if not exists public.capabilities (
  id       uuid primary key default gen_random_uuid(),
  key      text unique not null,
  title    text not null default '',
  tools    jsonb   not null default '[]'::jsonb,
  position int     not null default 0
);

comment on column public.capabilities.key is 'Stable slug used by the public site: digital-marketing, ai-tools, video-ai, social-media, editing.';

-- -----------------------------------------------------------------------------
-- 3. blog_posts — editable posts
--    category / read_time are optional extras so the existing public blog
--    filter chips and "x min read" labels keep working. Both are nullable.
--    content is stored as PLAIN TEXT (paragraphs separated by blank lines).
--    The public site escapes it before rendering, so it can never inject HTML.
-- -----------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  title         text        not null,
  date          text        not null default '',
  excerpt       text        not null default '',
  content       text        not null default '',
  thumbnail_url text        not null default '',
  slug          text        not null unique,
  category      text,
  read_time     text,
  created_at    timestamptz not null default now()
);

create index if not exists blog_posts_created_at_idx on public.blog_posts (created_at desc);

-- =============================================================================
-- Row Level Security
-- The public site reads with the anon key, and the /admin panel saves with that
-- same anon key (it is a client-side password, not real auth). These policies
-- are what make that flow work.
--
-- ⚠️ SECURITY NOTE: because the anon key ships inside the JS bundle, these
-- policies mean the tables are readable/writable by anyone who opens devtools.
-- The password only hides the /admin UI, it does not protect the data.
-- To actually lock it down later: switch the `to anon` policies to
-- `to authenticated` and sign in through Supabase Auth instead.
-- =============================================================================
alter table public.site_content  enable row level security;
alter table public.capabilities  enable row level security;
alter table public.blog_posts    enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update                 on public.site_content to anon, authenticated;
grant select, insert, update                 on public.capabilities to anon, authenticated;
grant select, insert, update, delete         on public.blog_posts to anon, authenticated;

drop policy if exists "site_content_read"   on public.site_content;
drop policy if exists "site_content_insert" on public.site_content;
drop policy if exists "site_content_update" on public.site_content;
create policy "site_content_read"   on public.site_content for select to anon, authenticated using (true);
create policy "site_content_insert" on public.site_content for insert to anon, authenticated with check (true);
create policy "site_content_update" on public.site_content for update to anon, authenticated using (true) with check (true);

drop policy if exists "capabilities_read"   on public.capabilities;
drop policy if exists "capabilities_insert" on public.capabilities;
drop policy if exists "capabilities_update" on public.capabilities;
create policy "capabilities_read"   on public.capabilities for select to anon, authenticated using (true);
create policy "capabilities_insert" on public.capabilities for insert to anon, authenticated with check (true);
create policy "capabilities_update" on public.capabilities for update to anon, authenticated using (true) with check (true);

drop policy if exists "blog_posts_read"   on public.blog_posts;
drop policy if exists "blog_posts_insert" on public.blog_posts;
drop policy if exists "blog_posts_update" on public.blog_posts;
drop policy if exists "blog_posts_delete" on public.blog_posts;
create policy "blog_posts_read"   on public.blog_posts for select to anon, authenticated using (true);
create policy "blog_posts_insert" on public.blog_posts for insert to anon, authenticated with check (true);
create policy "blog_posts_update" on public.blog_posts for update to anon, authenticated using (true) with check (true);
create policy "blog_posts_delete" on public.blog_posts for delete to anon, authenticated using (true);

-- =============================================================================
-- Seed with the portfolio's CURRENT hardcoded copy, so the admin panel opens
-- pre-filled and the public site renders identically to before.
-- Re-running never duplicates rows.
-- =============================================================================
insert into public.site_content (
  id, hero_name, hero_roles, hero_tagline, who_am_i_story,
  qualification_1_title, qualification_1_desc, qualification_1_timing,
  qualification_2_title, qualification_2_desc, qualification_2_timing,
  qualification_3_title, qualification_3_desc, qualification_3_timing,
  journey_quotes, contact_email, contact_phone, contact_linkedin
) values (
  'main',
  $$Sakshi Gill$$,
  $$["I'm a Digital Marketer","I'm a Content Strategist","I'm an AI-Powered Creator","I'm a Brand Storyteller"]$$::jsonb,
  $$I help brands find their voice and their audience - blending sharp digital marketing instincts with AI-powered tools to create content that actually connects. From strategy to execution, I turn ideas into stories people remember.$$,
  $$I’m Sakshi Gill — someone driven by an honest love for visual storytelling and an endless curiosity about how creative ideas truly connect with people. Growing up through school, scoring a perfect 100% in 10th grade and 91.8% in 12th gave me a foundation of steady discipline, but it was my quiet, instinctive pull toward words, design, and creative expression that hinted at where I was headed. During my graduation, completing my B.A. from Indira Gandhi College, Kurukshetra University with a 9.34 CGPA, I learned to look at human emotions, culture, and narratives with deep analytical clarity. The defining turning point came when I discovered and completed my course in Digital Marketing with AI — suddenly, strategic communication and intelligent generative technology merged, giving my creative drive a clear and powerful purpose. Today, that journey shapes everything I build: turning raw ideas into captivating digital stories that people don't just scroll past, but genuinely remember.$$,
  $$Schooling & Academic Foundation$$,
  $$Achieved a rare 100% in 10th grade and 91.8% in 12th — proving that consistency, curiosity, and steadfast discipline build the strongest launchpad for creative growth.$$,
  $$2022-23$$,
  $$Bachelor of Arts (B.A.)$$,
  $$Graduated with an exceptional 9.34 CGPA, honing deep analytical clarity, cultural empathy, and an instinct for what makes human stories truly resonate.$$,
  $$2023-26$$,
  $$Digital Marketing with AI$$,
  $$The pivotal breakthrough — fusing strategic brand storytelling with cutting-edge AI tools to design high-impact, forward-looking content.$$,
  $$$$,
  $$["\"Creativity is no longer just intuition; it is amplified imagination guided by data.\"","\"The boldest stories are written by those willing to dismantle yesterday’s assumptions.\"","Every phase of my progression has been shaped by an obsession with mastery: diving into emerging AI tools before they became mainstream, deconstructing what makes narrative stick, and constantly testing new creative frameworks. Growth is not an accident — it is an intentional, relentless practice."]$$::jsonb,
  $$divinesakshi03gmail.com@gmail.com$$,
  $$$$,
  $$https://www.linkedin.com/in/sakshigill$$
)
on conflict (id) do nothing;

insert into public.capabilities (key, title, tools, position) values
  ('digital-marketing', $$Digital Marketing$$,
   $$[{"name":"LinkedIn","icon":"linkedin"},{"name":"Pinterest","icon":"pinterest"},{"name":"Google Ads","icon":"target"},{"name":"Meta Ads","icon":"megaphone"},{"name":"SEO Strategy","icon":"search"},{"name":"Mailchimp","icon":"mail"}]$$::jsonb, 1),
  ('ai-tools', $$AI Tools$$,
   $$[{"name":"ChatGPT","icon":"chat"},{"name":"Gemini","icon":"sparkles"},{"name":"Claude","icon":"bot"},{"name":"Google AI Studio","icon":"code"},{"name":"Midjourney","icon":"image"},{"name":"Perplexity","icon":"search"}]$$::jsonb, 2),
  ('video-ai', $$Video Creating with AI$$,
   $$[{"name":"Google Flow AI","icon":"video"},{"name":"Kling AI","icon":"video"},{"name":"Dropshot.ai","icon":"camera"},{"name":"Runway Gen-3","icon":"film"},{"name":"Luma Dream","icon":"sparkles"},{"name":"Pika AI","icon":"zap"}]$$::jsonb, 3),
  ('social-media', $$Social Media$$,
   $$[{"name":"Instagram","icon":"camera"},{"name":"Facebook","icon":"users"},{"name":"YouTube","icon":"play"},{"name":"X (Twitter)","icon":"at"},{"name":"LinkedIn","icon":"linkedin"},{"name":"Pinterest","icon":"pinterest"}]$$::jsonb, 4),
  ('editing', $$Editing$$,
   $$[{"name":"InShot","icon":"scissors"},{"name":"CapCut","icon":"scissors"},{"name":"VN","icon":"scissors"},{"name":"Premiere Pro","icon":"film"},{"name":"DaVinci Resolve","icon":"sliders"},{"name":"Canva","icon":"palette"}]$$::jsonb, 5)
on conflict (key) do nothing;

-- NOTE: blog_posts is intentionally NOT seeded. The 4 existing articles stay
-- hardcoded in index.html and act as the fallback; anything you add from
-- /admin is merged on top of them (same slug = your version wins).

-- =============================================================================
-- Verify — you should see 1 site_content row and 5 capabilities rows.
-- =============================================================================
select 'site_content' as tbl, count(*) from public.site_content
union all select 'capabilities', count(*) from public.capabilities
union all select 'blog_posts', count(*) from public.blog_posts;
