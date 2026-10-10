/**
 * Build-time blog prerender.
 *
 * Reads published posts from Supabase with the public anon key (RLS allows
 * public reads of published rows only). If the database is unreachable or
 * empty, the bundled seed is prerendered instead so the site always ships
 * real crawlable HTML.
 *
 * Emits:
 *   dist/blog/index.html            listing, with cards in the markup
 *   dist/blog/<slug>/index.html     one static page per post, with the full
 *                                   article text, meta tags and JSON-LD
 *   dist/sitemap.xml                home, blog and every post
 *
 * Run after `vite build`:  npm run prerender
 */
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/* ---------------- input ---------------- */

function readEnv() {
  const file = join(root, '.env');
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !m[1].startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = readEnv();
const seed = JSON.parse(readFileSync(join(root, 'src/site/blogSeed.json'), 'utf8'));
const AUTHOR = seed.author;

/* Canonical URLs and the sitemap need a real origin. There is no deployment
 * URL in this repo, so it must come from SITE_URL rather than be guessed. */
const rawSite = (process.env.SITE_URL || env.SITE_URL || '').replace(/\/$/, '');
if (!rawSite) {
  console.warn('  ! SITE_URL is not set in .env — canonical tags and sitemap.xml');
  console.warn('    will point at localhost. Set SITE_URL to your live domain.');
}
const siteUrl = rawSite || 'http://localhost:4173';

/* ---------------- fetch ---------------- */

async function fetchPosts() {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const columns =
    'slug,title,category,read_time,published_at,meta_title,meta_description,body,excerpt,content,author,published,date';

  const headers = {apikey: key, Authorization: `Bearer ${key}`};
  const signal = AbortSignal.timeout(12000);

  const ask = async (qs) => {
    try {
      const res = await fetch(`${url}/rest/v1/blog_posts?${qs}`, {headers, signal});
      if (!res.ok) return {error: `Supabase returned ${res.status}`};
      const data = await res.json();
      return {data: Array.isArray(data) ? data : []};
    } catch (err) {
      return {error: err.message};
    }
  };

  // Preferred: published rows only, with every new column.
  const first = await ask(`select=${columns}&published=eq.true&order=published_at.desc`);
  if (!first.error) return first.data.filter((r) => r && r.published !== false);

  // `published` column not there yet (migration not run): legacy columns only.
  const legacyCols =
    'slug,title,category,read_time,date,excerpt,content,thumbnail_url';
  const legacy = await ask(`select=${legacyCols}&order=created_at.desc`);
  if (!legacy.error) return legacy.data.filter((r) => r && r.published !== false);

  console.warn(`  ! ${first.error} and ${legacy.error}; using seed content.`);
  return [];
}

function normalise(row) {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category || 'Digital Marketing',
    read: row.read_time || '',
    date: (row.published_at || row.date || '').slice(0, 10),
    metaTitle: row.meta_title || row.title,
    metaDescription: row.meta_description || row.excerpt || '',
    body: row.body || row.content || '',
    author: row.author || AUTHOR,
  };
}

const rows = (await fetchPosts()).map(normalise);
const posts = rows.length ? rows : seed.posts.map(normalise);
const source = rows.length ? 'Supabase' : 'seed';
console.log(`  posts: ${posts.length} (${source})`);

/* ---------------- helpers ---------------- */

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const palette = seed.palette;
const glyphs = seed.glyphs;
const fallback = 'Digital Marketing';

function style(category) {
  const [a, b, x, y] = palette[category] || palette[fallback];
  return `--cg:linear-gradient(145deg,${a},${b});--cb:${a};--ca:#fff;--sh:${b};--o1:${x};--o2:${y}`;
}

function glyph(category) {
  return glyphs[category] || glyphs[fallback];
}

function prettyDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
}

/* ---------------- head blocks ---------------- */

function applyHead(html, {title, description, canonical, jsonLd}) {
  let out = html;

  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  out = out.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${esc(description)}" />`,
  );

  const og = [
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');

  // Only the listing carries a canonical in the template; posts get one added.
  if (/<link rel="canonical"/.test(out)) {
    out = out.replace(
      /<link rel="canonical"[\s\S]*?\/>/,
      `<link rel="canonical" href="${esc(canonical)}" />\n    ${og}`,
    );
  } else {
    out = out.replace('</head>', `    <link rel="canonical" href="${esc(canonical)}" />\n    ${og}\n  </head>`);
  }

  if (jsonLd) {
    out = out.replace(
      '</head>',
      `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`,
    );
  }
  return out;
}

/* ---------------- listing ---------------- */

function card(p, i) {
  const faces = Array.from({length: 6}, () => `<i>${glyph(p.category)}</i>`).join('');
  return (
    `<a class="card" style="${style(p.category)};--i:${i}" href="/blog/${esc(p.slug)}">` +
    '<div class="face"><div class="bg"></div>' +
    `<span class="tag">${esc(p.category)}</span>` +
    `<div class="cube">${faces}</div>` +
    '<span class="orb2"></span>' +
    '<div class="panel">' +
    `<h3>${esc(p.title)}</h3>` +
    `<div class="meta">${esc(p.read)} • ${esc(p.author || AUTHOR)}</div>` +
    '<span class="more">Read More →</span>' +
    '</div></div></a>'
  );
}

const perPage = seed.perPage;
const firstPage = posts.slice(0, perPage);
const categories = [
  ...seed.categoryOrder.filter((c) => posts.some((p) => p.category === c)),
  ...[...new Set(posts.map((p) => p.category))].filter(
    (c) => c && !seed.categoryOrder.includes(c),
  ),
];

const listingBody =
  '<header class="go">' +
  '<div class="label">Kaithal\'s Trusted Digital Marketing Voice</div>' +
  '<h1 class="hero serif">Learn. Create. Grow.</h1>' +
  '<p class="lede">Insights on AI-powered marketing, content strategy, and creative tools — from Kaithal’s digital marketing specialist.</p>' +
  '<div class="stats">' +
  `<div class="stat"><b>${posts.length}</b><span>Articles</span></div>` +
  `<div class="stat"><b>${categories.length}</b><span>Categories</span></div>` +
  '<div class="stat"><b>AI</b><span>Powered</span></div>' +
  '</div></header>' +
  '<input id="q" class="search" type="search" placeholder="Search articles" value="" aria-label="Search articles">' +
  '<div class="pills" role="group" aria-label="Filter by category">' +
  ['All', ...categories]
    .map((c) => `<button class="pill${c === 'All' ? ' on' : ''}" data-c="${esc(c)}" type="button">${esc(c)}</button>`)
    .join('') +
  '</div>' +
  `<p class="count">${posts.length} article${posts.length === 1 ? '' : 's'} published</p>` +
  '<div class="arrs">' +
  '<button data-s="-1" type="button" aria-label="Scroll left">‹</button>' +
  '<button data-s="1" type="button" aria-label="Scroll right">›</button>' +
  '</div>' +
  '<div class="row">' + firstPage.map(card).join('') + '</div>' +
  '<nav class="pg" aria-label="Pagination">' +
  '<button data-p="0" type="button" disabled>← Prev</button>' +
  `<button class="cur" data-p="1" type="button">1</button>` +
  '<button data-p="2" type="button" disabled>Next →</button>' +
  '<span>Page 1 of 1</span>' +
  '</nav>' +
  '<section class="cta2">' +
  '<h2>Ready to grow your business in Kaithal?</h2>' +
  '<p>Tell me about your business and get a simple, honest plan.</p>' +
  '<button class="btn" type="button" onclick="location.href=\'/#connect\'">Get in touch</button>' +
  '</section>';

/* ---------------- write ---------------- */

const listTemplate = readFileSync(join(dist, 'blog.html'), 'utf8');
const postTemplate = readFileSync(join(dist, 'blog-post.html'), 'utf8');

/* listing */
const listDir = join(dist, 'blog');
mkdirSync(listDir, {recursive: true});
const listing = applyHead(listTemplate.replace(/<main id="app"[\s\S]*?<\/main>/, `<main id="app" class="blog-wrap">${listingBody}</main>`), {
  title: 'Blog | Sakshi Gill – Digital Marketer in Kaithal',
  description:
    "Insights on AI-powered marketing, content strategy and creative tools from Kaithal's digital marketing specialist.",
  canonical: `${siteUrl}/blog`,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Sakshi Gill Blog',
    url: `${siteUrl}/blog`,
    description:
      "Insights on AI-powered marketing, content strategy and creative tools from Kaithal's digital marketing specialist.",
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${siteUrl}/blog/${p.slug}`,
      datePublished: p.date,
    })),
  },
});
writeFileSync(join(listDir, 'index.html'), listing);
console.log('  dist/blog/index.html');

/* posts */
for (const p of posts) {
  const rel = posts.filter((r) => r.slug !== p.slug).slice(0, 3);
  const relHtml = rel.length
    ? '<h2>Related Articles</h2><ul class="rel">' +
      rel
        .map(
          (r) =>
            `<li><a href="/blog/${esc(r.slug)}">${esc(r.title)}</a><small>${esc(r.category)} • ${esc(r.read)}</small></li>`,
        )
        .join('') +
      '</ul>'
    : '';

  const article =
    `<article style="${style(p.category)}">` +
    '<button class="back" type="button">← Back to Blog</button>' +
    '<header class="ph">' +
    `<span class="cat">${esc(p.category)}</span>` +
    `<h1>${esc(p.title)}</h1>` +
    `<p>${esc(p.read)} • ${esc(p.author || AUTHOR)} • ${esc(prettyDate(p.date))}</p>` +
    '</header>' +
    `<div class="prose">${p.body}</div>` +
    '<div class="cta">Like this? I write about AI, marketing and creative tools every week. ' +
    'Read more at <a href="/blog">the blog</a>.</div>' +
    '<div class="author">' +
    `<b>Written by ${esc(p.author || AUTHOR)}</b>` +
    '<span>Digital Marketer &amp; AI Specialist, Kaithal</span>' +
    '<span>Content on AI-powered marketing, content strategy and creative tools.</span>' +
    '</div></article>' +
    (relHtml
      ? '<section class="blog-wrap-rel" style="max-width:1100px;margin:48px auto 0;padding:0 20px 24px">' +
        relHtml +
        '<div class="row" style="padding-bottom:0">' +
        rel.map((r, i) => card(r, i)).join('') +
        '</div></section>'
      : '') +
    '<section class="cta2">' +
    '<h2>Want marketing like this for your business?</h2>' +
    '<p>Tell me what you are building and we can plan it together.</p>' +
    `<button class="btn" type="button" onclick="location.href='/#connect'">Get in touch</button>` +
    '</section>';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.metaDescription,
    url: `${siteUrl}/blog/${p.slug}`,
    mainEntityOfPage: `${siteUrl}/blog/${p.slug}`,
    datePublished: p.date,
    dateModified: p.date,
    articleSection: p.category,
    wordcount: p.body.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
    timeRequired: p.read,
    inLanguage: 'en',
    author: {'@type': 'Person', name: p.author || AUTHOR, url: `${siteUrl}/#home`},
    publisher: {'@type': 'Person', name: AUTHOR, url: `${siteUrl}/#home`},
  };

  const canonical = `${siteUrl}/blog/${p.slug}`;
  const html = applyHead(
    postTemplate.replace(/<main id="post"[\s\S]*?<\/main>/, `<main id="post" class="blog-wrap">${article}</main>`),
    {title: p.metaTitle, description: p.metaDescription, canonical, jsonLd},
  );

  const dir = join(dist, 'blog', p.slug);
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`  dist/blog/${p.slug}/index.html`);
}

/* home page: swap the __SITE_URL__ placeholder with the real origin */
const indexPath = join(dist, 'index.html');
if (existsSync(indexPath)) {
  const home = readFileSync(indexPath, 'utf8');
  writeFileSync(indexPath, home.split('__SITE_URL__').join(siteUrl));
  console.log('  dist/index.html (SITE_URL injected)');
}

/* sitemap */
const urls = [
  {loc: `${siteUrl}/`, priority: '1.0'},
  {loc: `${siteUrl}/blog`, priority: '0.8'},
  ...posts.map((p) => ({loc: `${siteUrl}/blog/${p.slug}`, lastmod: p.date, priority: '0.6'})),
];

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${esc(u.loc)}</loc>` +
        (u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : '') +
        `\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n') +
  '\n</urlset>\n';

writeFileSync(join(dist, 'sitemap.xml'), sitemap);
console.log('  dist/sitemap.xml');

/* robots */
const robots = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
writeFileSync(join(dist, 'robots.txt'), robots);
console.log('  dist/robots.txt');

console.log('  prerender done.');