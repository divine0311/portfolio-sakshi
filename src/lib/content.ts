import {supabase} from './supabase';

export interface SiteContent {
  hero_name: string;
  hero_roles: string[];
  hero_tagline: string;
  who_am_i_story: string;
  qualification_1_title: string;
  qualification_1_desc: string;
  qualification_1_timing: string;
  qualification_2_title: string;
  qualification_2_desc: string;
  qualification_2_timing: string;
  qualification_3_title: string;
  qualification_3_desc: string;
  qualification_3_timing: string;
  journey_quotes: string[];
  contact_email: string;
  contact_phone: string;
  contact_linkedin: string;
  projects_label: string;
  projects_heading: string;
  projects_subtitle: string;
  vision_subheading: string;
  vision_headline: string;
  vision_paragraph: string;
}

export type SiteContentUpdate = Partial<SiteContent>;

export interface CapabilityTool {
  name: string;
  icon: string;
}

export interface Capability {
  key: string;
  title: string;
  tools: CapabilityTool[];
  position: number;
}

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  thumbnail_url: string;
  slug: string;
  category: string | null;
  read_time: string | null;
  created_at: string;
  /* SEO + publishing columns. Optional so existing rows keep working. */
  meta_title?: string | null;
  meta_description?: string | null;
  body?: string | null;
  author?: string | null;
  published?: boolean;
  published_at?: string | null;
}

export type BlogPostInput = Omit<BlogPost, 'id' | 'created_at'>;

export type SaveResult = {ok: true} | {ok: false; error: string};

const READ_TIMEOUT_MS = 6000;

interface QueryResult {
  data: any;
  error: {message: string} | null;
}

function withTimeout(work: PromiseLike<unknown>, ms: number = READ_TIMEOUT_MS): Promise<QueryResult | null> {
  return new Promise<QueryResult | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    Promise.resolve(work).then(
      (value) => {
        clearTimeout(timer);
        resolve(value as QueryResult);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function toToolList(value: unknown): CapabilityTool[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === 'string') return [{name: entry, icon: 'sparkles'}];
    if (entry && typeof entry === 'object') {
      const tool = entry as {name?: unknown; icon?: unknown};
      if (typeof tool.name === 'string' && tool.name.trim() !== '') {
        return [{name: tool.name, icon: typeof tool.icon === 'string' ? tool.icon : 'sparkles'}];
      }
    }
    return [];
  });
}

/**
 * Explicit column list. Never use select('*') here: the publishable anon key
 * cannot introspect the schema, so a wildcard select fails with a 404.
 */
const SITE_CONTENT_COLUMNS = [
  'hero_name',
  'hero_roles',
  'hero_tagline',
  'who_am_i_story',
  'qualification_1_title',
  'qualification_1_desc',
  'qualification_1_timing',
  'qualification_2_title',
  'qualification_2_desc',
  'qualification_2_timing',
  'qualification_3_title',
  'qualification_3_desc',
  'qualification_3_timing',
  'journey_quotes',
  'contact_email',
  'contact_phone',
  'contact_linkedin',
  'projects_label',
  'projects_heading',
  'projects_subtitle',
  'vision_subheading',
  'vision_headline',
  'vision_paragraph',
].join(',');

export async function loadSiteContent(): Promise<SiteContent | null> {
  if (!supabase) return null;
  const result = await withTimeout(
    supabase.from('site_content').select(SITE_CONTENT_COLUMNS).eq('id', 'main').maybeSingle(),
  );
  const row = result?.data as Partial<SiteContent> | null | undefined;
  if (!row) return null;
  return {
    ...row,
    hero_roles: toStringList(row.hero_roles),
    journey_quotes: toStringList(row.journey_quotes),
  } as SiteContent;
}

export async function saveSiteContent(patch: SiteContentUpdate): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {error} = await supabase.from('site_content').upsert({id: 'main', ...patch});
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}

export async function loadCapabilities(): Promise<Capability[] | null> {
  if (!supabase) return null;
  const result = await withTimeout(
    supabase.from('capabilities').select('key,title,tools,position').order('position'),
  );
  const rows = result?.data as Array<Record<string, unknown>> | null | undefined;
  if (!rows) return null;
  return rows.map((row) => ({
    key: String(row.key),
    title: typeof row.title === 'string' ? row.title : '',
    tools: toToolList(row.tools),
    position: typeof row.position === 'number' ? row.position : 0,
  }));
}

export async function saveCapability(key: string, title: string, tools: CapabilityTool[]): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {error} = await supabase
    .from('capabilities')
    .upsert({key, title, tools, position: 0}, {onConflict: 'key'});
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}

export interface Project {
  key: string;
  kicker: string;
  title: string;
  url: string;
  beneficial_title: string;
  benefits: string[];
  position: number;
}

export async function loadProjects(): Promise<Project[] | null> {
  if (!supabase) return null;
  const result = await withTimeout(
    supabase.from('projects').select('key,kicker,title,url,beneficial_title,benefits,position').order('position'),
  );
  const rows = result?.data as Array<Record<string, unknown>> | null | undefined;
  if (!rows) return null;
  return rows.map((row) => ({
    key: String(row.key),
    kicker: typeof row.kicker === 'string' ? row.kicker : '',
    title: typeof row.title === 'string' ? row.title : '',
    url: typeof row.url === 'string' ? row.url : '',
    beneficial_title: typeof row.beneficial_title === 'string' ? row.beneficial_title : '',
    benefits: toStringList(row.benefits),
    position: typeof row.position === 'number' ? row.position : 0,
  }));
}

export async function saveProject(project: Project): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {error} = await supabase.from('projects').upsert(project, {onConflict: 'key'});
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}

export async function deleteProject(key: string): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {error} = await supabase.from('projects').delete().eq('key', key);
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}

export async function deleteCapability(key: string): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {error} = await supabase.from('capabilities').delete().eq('key', key);
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}

const BLOG_COLUMNS =
  'id,title,date,excerpt,content,thumbnail_url,slug,category,read_time,created_at,meta_title,meta_description,body,author,published,published_at';

/**
 * Columns that only exist after `supabase/blog-modernisation.sql` has been
 * run. Until then we read and write the legacy set only, so the site and the
 * Admin Panel keep working instead of failing on an unknown column.
 */
const V2_COLUMNS = ['meta_title', 'meta_description', 'body', 'author', 'published', 'published_at'];
const LEGACY_COLUMNS =
  'id,title,date,excerpt,content,thumbnail_url,slug,category,read_time,created_at';

let v2Available = true;

export async function loadBlogPosts(): Promise<BlogPost[] | null> {
  if (!supabase) return null;

  let result = await withTimeout(
    supabase.from('blog_posts').select(BLOG_COLUMNS).order('created_at', {ascending: false}),
  );

  // Missing new columns: fall back to the legacy set and remember it.
  if (result?.error) {
    v2Available = false;
    result = await withTimeout(
      supabase.from('blog_posts').select(LEGACY_COLUMNS).order('created_at', {ascending: false}),
    );
  }

  const rows = result?.data as BlogPost[] | null | undefined;
  if (!rows) return null;
  return rows;
}

/** Drops v2 keys when the database has not been migrated yet. */
function shape(input: BlogPostInput): BlogPostInput {
  if (v2Available) return input;
  const out = {...input} as Record<string, unknown>;
  V2_COLUMNS.forEach((key) => delete out[key]);
  return out as BlogPostInput;
}

export async function createBlogPost(input: BlogPostInput): Promise<SaveResult & {id?: string}> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {data, error} = await supabase.from('blog_posts').insert(shape(input)).select('id').single();
  if (error) return {ok: false, error: error.message};
  return {ok: true, id: (data as {id: string}).id};
}

export async function updateBlogPost(id: string, input: BlogPostInput): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {error} = await supabase.from('blog_posts').update(shape(input)).eq('id', id);
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}

export async function deleteBlogPost(id: string): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {error} = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}
