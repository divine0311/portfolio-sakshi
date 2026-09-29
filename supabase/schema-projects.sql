-- =============================================================================
-- Sakshi Gill — Portfolio CMS · MIGRATION 2 (Projects + Vision)
-- Run this in Supabase -> SQL Editor AFTER schema.sql.
-- Adds the two navbar sections that had no storage yet: My Projects and Vision.
-- Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------- vision ----
-- Plus the Projects section header (label / heading / subtitle).
alter table public.site_content
  add column if not exists projects_label    text not null default '',
  add column if not exists projects_heading  text not null default '',
  add column if not exists projects_subtitle text not null default '',
  add column if not exists vision_subheading text not null default '',
  add column if not exists vision_headline   text not null default '',
  add column if not exists vision_paragraph  text not null default '';

-- -------------------------------------------------------------- projects ----
-- One row per project card. benefits is a JSON array of plain strings in the
-- form "Label: description" — the public site splits on the first colon to
-- rebuild the <strong> label + body, so nothing is ever injected as HTML.
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  key             text unique not null,
  kicker          text   not null default '',
  title           text   not null default '',
  url             text   not null default '',
  beneficial_title text  not null default '',
  benefits        jsonb  not null default '[]'::jsonb,
  position        int    not null default 0
);

alter table public.projects enable row level security;

grant select, insert, update on public.projects to anon, authenticated;

drop policy if exists "projects_read"   on public.projects;
drop policy if exists "projects_insert" on public.projects;
drop policy if exists "projects_update" on public.projects;
create policy "projects_read"   on public.projects for select to anon, authenticated using (true);
create policy "projects_insert" on public.projects for insert to anon, authenticated with check (true);
create policy "projects_update" on public.projects for update to anon, authenticated using (true) with check (true);

-- ----------------------------------------------------------------- seed -----
update public.site_content set
  projects_label    = $$Portfolio & Works$$,
  projects_heading  = $$My Projects$$,
  projects_subtitle = $$A compact showcase of live applications, educational web platforms, and generative AI motion.$$,
  vision_subheading = $$Looking Forward$$,
  vision_headline   = $$The Future Belongs to Storytellers Who Master Intelligent Machines.$$,
  vision_paragraph  = $$My vision is to architect campaigns and digital platforms that don't merely adapt to the AI revolution — they shape its cultural trajectory. By uniting human vulnerability and machine intelligence, we can build brands that inspire enduring loyalty and profound resonance.$$
where id = 'main';

insert into public.projects (key, kicker, title, url, beneficial_title, benefits, position) values
  ('typing-rush',
   $$Project 01 · Game$$,
   $$Typing Rush$$,
   $$https://typing-rush-game.vercel.app$$,
   $$Why Typing Rush Is Beneficial$$,
   $$["Reflex & Speed: Sharpens hand-eye coordination and increases keystroke velocity by up to 2x under real-time time constraints.","Accuracy & Muscle Memory: Trains instinctive touch-typing patterns to drastically reduce typos in daily writing and coding.","Focus & Flow State: Sprint rounds demand complete presence, eliminating distractions and conditioning mental endurance.","Live Benchmark Metrics: Real-time WPM analytics and multiplier streaks provide clear, measurable self-improvement."]$$::jsonb,
   1),
  ('gyanix-academy',
   $$Project 02 · Website$$,
   $$Gyanix Academy$$,
   $$https://gyanix-acedemy-gyanix-academy-8bqc.vercel.app$$,
   $$Why Gyanix Academy Is Beneficial$$,
   $$["In-Demand AI Curriculum: Teaches cutting-edge generative AI tools, full-funnel digital marketing, and content systems.","Job & Client Readiness: Emphasizes actionable portfolio projects and practical execution over passive theoretical lectures.","Self-Paced Learning: Modular tracks allow students and busy professionals to master high-income skills on their schedule.","High-Speed UX Architecture: Lightweight and responsive design delivers instant load times and frictionless navigation on mobile."]$$::jsonb,
   2)
on conflict (key) do nothing;

-- ---------------------------------------------------------------- verify ----
select 'site_content' as tbl, count(*) from public.site_content
union all select 'capabilities', count(*) from public.capabilities
union all select 'projects', count(*) from public.projects
union all select 'blog_posts', count(*) from public.blog_posts;
