/**
 * Seed content and the category palette.
 *
 * The raw data lives in `blogSeed.json` so the browser bundle and the Node
 * prerender script read from one source and can never drift apart.
 *
 * The palette is the single source of truth for the 3D cards and the post
 * header. A category added later from the Admin Panel is not in this map, so
 * `categoryStyle` falls back to the Digital Marketing colours and glyph.
 */
import type {BlogPost} from '../lib/content';
import seed from './blogSeed.json';

export const AUTHOR: string = seed.author;
export const CATEGORY_ORDER: string[] = seed.categoryOrder;

/** 3 cards per page, as per the reference. */
export const PER_PAGE: number = seed.perPage;

type Quad = [string, string, string, string];

/** start, end, cube light, cube dark. */
const PALETTE: Record<string, Quad> = seed.palette as unknown as Record<string, Quad>;
const GLYPH: Record<string, string> = seed.glyphs;

const FALLBACK = 'Digital Marketing';

export function categoryStyle(category: string | null | undefined): string {
  const [a, b, x, y] = PALETTE[category || ''] || PALETTE[FALLBACK];
  return (
    `--cg:linear-gradient(145deg,${a},${b});` +
    `--cb:${a};--ca:#fff;--sh:${b};--o1:${x};--o2:${y}`
  );
}

export function categoryGlyph(category: string | null | undefined): string {
  return GLYPH[category || ''] || GLYPH[FALLBACK];
}

/** Real routes in the existing site. */
export const LINKS = {
  home: '/#home',
  blog: '/blog',
  services: '/#capabilities',
  contact: '/#connect',
  email: 'divinesakshi03gmail.com@gmail.com',
};

type SeedRow = (typeof seed.posts)[number];

export const BLOG_SEED: BlogPost[] = (seed.posts as SeedRow[]).map((row) => ({
  id: `seed-${row.slug}`,
  created_at: `${row.published_at}T09:00:00.000Z`,
  slug: row.slug,
  title: row.title,
  category: row.category,
  read_time: row.read_time,
  excerpt: row.meta_description,
  content: row.body,
  thumbnail_url: '',
  meta_title: row.meta_title,
  meta_description: row.meta_description,
  body: row.body,
  author: AUTHOR,
  published: true,
  published_at: row.published_at,
  date: row.published_at,
}));