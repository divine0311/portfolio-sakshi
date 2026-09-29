-- PART A: LOCK WRITES TO LOGGED-IN ADMINS
drop policy if exists "site_content_read"
  on public.site_content;
create policy "site_content_read"
  on public.site_content for select to anon using (true);
drop policy if exists "capabilities_read"
  on public.capabilities;
create policy "capabilities_read"
  on public.capabilities for select to anon using (true);
drop policy if exists "projects_read"
  on public.projects;
create policy "projects_read"
  on public.projects for select to anon using (true);
drop policy if exists "blog_posts_read"
  on public.blog_posts;
create policy "blog_posts_read"
  on public.blog_posts for select to anon using (true);
drop policy if exists "site_content_insert"
  on public.site_content;
drop policy if exists "site_content_update"
  on public.site_content;
drop policy if exists "capabilities_insert"
  on public.capabilities;
drop policy if exists "capabilities_update"
  on public.capabilities;
drop policy if exists "blog_posts_insert"
  on public.blog_posts;
drop policy if exists "blog_posts_update"
  on public.blog_posts;
drop policy if exists "blog_posts_delete"
  on public.blog_posts;
drop policy if exists "projects_insert"
  on public.projects;
drop policy if exists "projects_update"
  on public.projects;
create policy "site_content_admin_write"
  on public.site_content for all to authenticated
  using (true) with check (true);
create policy "capabilities_admin_write"
  on public.capabilities for all to authenticated
  using (true) with check (true);
create policy "blog_posts_admin_write"
  on public.blog_posts for all to authenticated
  using (true) with check (true);
create policy "projects_admin_write"
  on public.projects for all to authenticated
  using (true) with check (true);
revoke insert, update, delete
  on public.site_content from anon;
revoke insert, update, delete
  on public.capabilities from anon;
revoke insert, update, delete
  on public.blog_posts from anon;
revoke insert, update, delete
  on public.projects from anon;
notify pgrst, 'reload schema';
