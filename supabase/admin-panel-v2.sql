-- =============================================================================
-- Admin Panel v2 — additive migration. Safe to re-run.
--
-- Adds the two pieces of data the rebuilt admin panel manages that had no
-- storage yet:
--   1. An "institute" line for each of the three qualifications
--      (the public roadmap already renders .roadmap-institution).
--   2. A description + optional image for each project card.
--
-- Nothing is dropped, so existing rows keep working. Run the whole file in
-- Supabase Studio > SQL Editor. Then run:
--   supabase/admin-security.sql   (locks writes to signed-in admins)
--   supabase/part-b-images.sql    (images table + storage bucket)
-- =============================================================================

-- ----------------------------------------------- qualifications ----
alter table public.site_content
  add column if not exists qualification_1_institution text not null default '',
  add column if not exists qualification_2_institution text not null default '',
  add column if not exists qualification_3_institution text not null default '';

-- Seed the institutions from the copy that is currently hard-coded on the site.
update public.site_content set
  qualification_1_institution = 'Secondary (10th: 100%) & Senior Secondary (12th: 91.8%)',
  qualification_2_institution = 'Indira Gandhi College, Kurukshetra University (CGPA 9.34 / 10)',
  qualification_3_institution = 'Advanced Specialized Certification'
where id = 'main'
  and qualification_1_institution = ''
  and qualification_2_institution = ''
  and qualification_3_institution = '';

-- ------------------------------------------------------ projects ----
alter table public.projects
  add column if not exists description text not null default '',
  add column if not exists image_url   text not null default '';

-- -------------------------------------------------------- verify ----
select 'site_content' as tbl, count(*) from public.site_content
union all select 'projects', count(*) from public.projects
union all select 'site_images', count(*) from public.site_images;

notify pgrst, 'reload schema';
