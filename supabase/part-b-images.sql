-- PART B: IMAGE SLOTS + STORAGE BUCKET
create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  slot text not null unique
    check (slot in ('hero', 'about', 'journey')),
  url text not null default '',
  storage_path text not null default '',
  alt text not null default '',
  heading text not null default '',
  description text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site_images
  enable row level security;
grant select on public.site_images
  to anon, authenticated;
grant insert, update, delete on public.site_images
  to authenticated;
drop policy if exists "site_images_read"
  on public.site_images;
drop policy if exists "site_images_admin_write"
  on public.site_images;
create policy "site_images_read"
  on public.site_images for select to anon using (true);
create policy "site_images_admin_write"
  on public.site_images for all to authenticated
  using (true) with check (true);
insert into public.site_images
  (slot, url, alt, heading, description)
values
  ('hero', '/sakshi_portrait.jpg', 'Sakshi Gill',
   'My Hero', 'A look into the person behind the work.'),
  ('about', '/Character_head_tracking_animation_20260923172045.jpeg',
   'Sakshi Gill portrait', 'My Story',
   'An honest love for visual storytelling.'),
  ('journey', '/sakshi_portrait.jpg', 'Sakshi Gill',
   'My Journey', 'Every phase shaped by an obsession with mastery.')
on conflict (slot) do nothing;
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;
drop policy if exists "site_images_public_read"
  on storage.objects;
drop policy if exists "site_images_admin_write"
  on storage.objects;
create policy "site_images_public_read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-images');
create policy "site_images_admin_write"
  on storage.objects for all to authenticated
  using (bucket_id = 'site-images')
  with check (bucket_id = 'site-images');
notify pgrst, 'reload schema';
select slot, url from public.site_images
  order by slot;
