drop table if exists public.contact_messages cascade;
drop table if exists public.projects cascade;
drop table if exists public.blog_posts cascade;
drop table if exists public.capabilities cascade;
drop table if exists public.site_content cascade;
drop function if exists public.prevent_duplicate_contact_message();
create extension if not exists "pgcrypto";
create table public.site_content (
  id text primary key default 'main' check (id = 'main'),
  hero_name text not null default '',
  hero_roles jsonb not null default '[]'::jsonb,
  hero_tagline text not null default '',
  who_am_i_story text not null default '',
  qualification_1_title text not null default '',
  qualification_1_desc text not null default '',
  qualification_1_timing text not null default '',
  qualification_2_title text not null default '',
  qualification_2_desc text not null default '',
  qualification_2_timing text not null default '',
  qualification_3_title text not null default '',
  qualification_3_desc text not null default '',
  qualification_3_timing text not null default '',
  journey_quotes jsonb not null default '[]'::jsonb,
  contact_email text not null default '',
  contact_phone text not null default '',
  contact_linkedin text not null default '',
  projects_label text not null default '',
  projects_heading text not null default '',
  projects_subtitle text not null default '',
  vision_subheading text not null default '',
  vision_headline text not null default '',
  vision_paragraph text not null default '',
  updated_at timestamptz not null default now()
);
create table public.capabilities (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null default '',
  tools jsonb not null default '[]'::jsonb,
  position int not null default 0
);
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text not null default '',
  excerpt text not null default '',
  content text not null default '',
  thumbnail_url text not null default '',
  slug text not null unique,
  category text,
  read_time text,
  created_at timestamptz not null default now()
);
create index blog_posts_created_at_idx on public.blog_posts (created_at desc);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  kicker text not null default '',
  title text not null default '',
  url text not null default '',
  beneficial_title text not null default '',
  benefits jsonb not null default '[]'::jsonb,
  position int not null default 0
);
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 5000),
  user_agent text,
  fingerprint text,
  created_at timestamptz not null default now()
);
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
alter table public.site_content enable row level security;
alter table public.capabilities enable row level security;
alter table public.blog_posts enable row level security;
alter table public.projects enable row level security;
alter table public.contact_messages enable row level security;
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.site_content to anon, authenticated;
grant select, insert, update on public.capabilities to anon, authenticated;
grant select, insert, update, delete on public.blog_posts to anon, authenticated;
grant select, insert, update on public.projects to anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
create policy "site_content_read" on public.site_content for select to anon, authenticated using (true);
create policy "site_content_insert" on public.site_content for insert to anon, authenticated with check (true);
create policy "site_content_update" on public.site_content for update to anon, authenticated using (true) with check (true);
create policy "capabilities_read" on public.capabilities for select to anon, authenticated using (true);
create policy "capabilities_insert" on public.capabilities for insert to anon, authenticated with check (true);
create policy "capabilities_update" on public.capabilities for update to anon, authenticated using (true) with check (true);
create policy "blog_posts_read" on public.blog_posts for select to anon, authenticated using (true);
create policy "blog_posts_insert" on public.blog_posts for insert to anon, authenticated with check (true);
create policy "blog_posts_update" on public.blog_posts for update to anon, authenticated using (true) with check (true);
create policy "blog_posts_delete" on public.blog_posts for delete to anon, authenticated using (true);
create policy "projects_read" on public.projects for select to anon, authenticated using (true);
create policy "projects_insert" on public.projects for insert to anon, authenticated with check (true);
create policy "projects_update" on public.projects for update to anon, authenticated using (true) with check (true);
create policy "contact_messages_insert" on public.contact_messages for insert to anon, authenticated with check (true);
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
  $$I am Sakshi Gill, someone driven by an honest love for visual storytelling and an endless curiosity about how creative ideas truly connect with people. Growing up through school, scoring a perfect 100% in 10th grade and 91.8% in 12th gave me a foundation of steady discipline, but it was my quiet, instinctive pull toward words, design, and creative expression that hinted at where I was headed. During my graduation, completing my B.A. from Indira Gandhi College, Kurukshetra University with a 9.34 CGPA, I learned to look at human emotions, culture, and narratives with deep analytical clarity. The defining turning point came when I discovered and completed my course in Digital Marketing with AI - suddenly, strategic communication and intelligent generative technology merged, giving my creative drive a clear and powerful purpose. Today, that journey shapes everything I build: turning raw ideas into captivating digital stories that people don't just scroll past, but genuinely remember.$$,
  $$Schooling & Academic Foundation$$,
  $$Achieved a rare 100% in 10th grade and 91.8% in 12th, proving that consistency, curiosity, and steadfast discipline build the strongest launchpad for creative growth.$$,
  $$2022-23$$,
  $$Bachelor of Arts (B.A.)$$,
  $$Graduated with an exceptional 9.34 CGPA, honing deep analytical clarity, cultural empathy, and an instinct for what makes human stories truly resonate.$$,
  $$2023-26$$,
  $$Digital Marketing with AI$$,
  $$The pivotal breakthrough - fusing strategic brand storytelling with cutting-edge AI tools to design high-impact, forward-looking content.$$,
  $$$$,
  $$["\"Creativity is no longer just intuition; it is amplified imagination guided by data.\"","\"The boldest stories are written by those willing to dismantle yesterday assumptions.\"","Every phase of my progression has been shaped by an obsession with mastery: diving into emerging AI tools before they became mainstream, deconstructing what makes narrative stick, and constantly testing new creative frameworks. Growth is not an accident - it is an intentional, relentless practice."]$$::jsonb,
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
update public.site_content set
  projects_label = $$Portfolio & Works$$,
  projects_heading = $$My Projects$$,
  projects_subtitle = $$A compact showcase of live applications, educational web platforms, and generative AI motion.$$,
  vision_subheading = $$Looking Forward$$,
  vision_headline = $$The Future Belongs to Storytellers Who Master Intelligent Machines.$$,
  vision_paragraph = $$My vision is to architect campaigns and digital platforms that don't merely adapt to the AI revolution - they shape its cultural trajectory. By uniting human vulnerability and machine intelligence, we can build brands that inspire enduring loyalty and profound resonance.$$
where id = 'main';
insert into public.projects (key, kicker, title, url, beneficial_title, benefits, position) values
  ('typing-rush',
   $$Project 01 - Game$$,
   $$Typing Rush$$,
   $$https://typing-rush-game.vercel.app$$,
   $$Why Typing Rush Is Beneficial$$,
   $$["Reflex & Speed: Sharpens hand-eye coordination and increases keystroke velocity by up to 2x under real-time time constraints.","Accuracy & Muscle Memory: Trains instinctive touch-typing patterns to drastically reduce typos in daily writing and coding.","Focus & Flow State: Sprint rounds demand complete presence, eliminating distractions and conditioning mental endurance.","Live Benchmark Metrics: Real-time WPM analytics and multiplier streaks provide clear, measurable self-improvement."]$$::jsonb,
   1),
  ('gyanix-academy',
   $$Project 02 - Website$$,
   $$Gyanix Academy$$,
   $$https://gyanix-acedemy-gyanix-academy-8bqc.vercel.app$$,
   $$Why Gyanix Academy Is Beneficial$$,
   $$["In-Demand AI Curriculum: Teaches cutting-edge generative AI tools, full-funnel digital marketing, and content systems.","Job & Client Readiness: Emphasizes actionable portfolio projects and practical execution over passive theoretical lectures.","Self-Paced Learning: Modular tracks allow students and busy professionals to master high-income skills on their schedule.","High-Speed UX Architecture: Lightweight and responsive design delivers instant load times and frictionless navigation on mobile."]$$::jsonb,
   2)
on conflict (key) do nothing;
select 'site_content' as tbl, count(*) from public.site_content
union all select 'capabilities', count(*) from public.capabilities
union all select 'blog_posts', count(*) from public.blog_posts
union all select 'projects', count(*) from public.projects
union all select 'contact_messages', count(*) from public.contact_messages;
notify pgrst, 'reload schema';
