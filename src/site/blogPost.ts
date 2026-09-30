/**
 * Individual post view, ported from APPENDIX A.
 *
 * The article lives inside a semantic <article> with exactly one <h1>; section
 * headings stay <h2>. Meta tags, canonical link and BlogPosting JSON-LD are
 * written per post so crawlers see the title, description and URL.
 */
import './blog.css';
import {loadBlogPosts} from '../lib/content';
import type {BlogPost} from '../lib/content';
import {AUTHOR, BLOG_SEED, LINKS, categoryGlyph, categoryStyle} from './blogSeed';
import {renderFooter} from './blogFooter';

const main = document.getElementById('post') as HTMLElement;
const slug = decodeURIComponent(location.pathname.replace(/^\/blog\/?|\/$/g, ''));

let posts: BlogPost[] = BLOG_SEED.slice();

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dateOf(p: BlogPost): string {
  return p.published_at || p.date;
}

function titleOf(p: BlogPost): string {
  return p.meta_title || p.title;
}

function descOf(p: BlogPost): string {
  return p.meta_description || p.excerpt || '';
}

function bodyOf(p: BlogPost): string {
  return p.body || p.content || '';
}

function prettyDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
}

function ensureMeta(selector: string, attr: 'name' | 'property', key: string, value: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function ensureCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function applyHead(p: BlogPost): void {
  const canonical = `${location.origin}/blog/${p.slug}`;
  const desc = descOf(p);
  document.title = titleOf(p);
  ensureMeta('meta[name="description"]', 'name', 'description', desc);
  ensureMeta('meta[property="og:title"]', 'property', 'og:title', titleOf(p));
  ensureMeta('meta[property="og:description"]', 'property', 'og:description', desc);
  ensureMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
  ensureMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
  ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  ensureCanonical(canonical);

  const old = document.getElementById('jsonld');
  if (old) old.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'jsonld';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: desc,
    url: canonical,
    mainEntityOfPage: canonical,
    datePublished: dateOf(p),
    dateModified: dateOf(p),
    articleSection: p.category,
    wordcount: bodyOf(p).replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
    timeRequired: p.read_time || undefined,
    author: {'@type': 'Person', name: p.author || AUTHOR, url: `${location.origin}/#home`},
    publisher: {'@type': 'Person', name: AUTHOR, url: `${location.origin}/#home`},
  });
  document.head.appendChild(script);
}

function related(p: BlogPost): BlogPost[] {
  const pool = posts
    .filter((r) => r.slug !== p.slug && r.published !== false)
    .sort((a, b) => (dateOf(b) < dateOf(a) ? -1 : 1));
  const same = pool.filter((r) => r.category === p.category);
  return [...same, ...pool.filter((r) => r.category !== p.category)].slice(0, 3);
}

function face(p: BlogPost, i: number, locationClass: boolean): string {
  const faces = Array.from({length: 6}, () => `<i>${categoryGlyph(p.category)}</i>`).join('');
  return (
    `<a class="card${locationClass ? '' : ''}" style="${categoryStyle(p.category)};--i:${i}" href="/blog/${p.slug}">` +
    '<div class="face"><div class="bg"></div>' +
    `<span class="tag">${escapeHtml(p.category || 'Article')}</span>` +
    `<div class="cube">${faces}</div>` +
    '<span class="orb2"></span>' +
    '<div class="panel">' +
    `<h3>${escapeHtml(p.title)}</h3>` +
    `<div class="meta">${escapeHtml(p.read_time || '')} • ${escapeHtml(AUTHOR)}</div>` +
    '<span class="more">Read More →</span>' +
    '</div></div></a>'
  );
}

function render(): void {
  const p = posts.find((r) => r.slug === slug);
  if (!p) {
    main.innerHTML =
      '<div class="empty"><p>This article does not exist.</p>' +
      `<p><a class="btn" href="/blog">Back to Blog</a></p></div>`;
    return;
  }

  applyHead(p);

  const rel = related(p);
  const relHtml = rel.length
    ? '<h2>Related Articles</h2><ul class="rel">' +
      rel
        .map(
          (r) =>
            '<li><a href="/blog/' +
            r.slug +
            '">' +
            escapeHtml(r.title) +
            `</a><small>${escapeHtml(r.category || '')} • ${escapeHtml(r.read_time || '')}</small></li>`,
        )
        .join('') +
      '</ul>'
    : '';

  main.innerHTML =
    '<article style="' +
    categoryStyle(p.category) +
    '">' +
    '<button class="back" type="button">← Back to Blog</button>' +
    '<header class="ph">' +
    `<span class="cat">${escapeHtml(p.category || 'Article')}</span>` +
    `<h1>${escapeHtml(p.title)}</h1>` +
    `<p>${escapeHtml(p.read_time || '')} • ${escapeHtml(p.author || AUTHOR)} • ${escapeHtml(prettyDate(dateOf(p)))}</p>` +
    '</header>' +
    `<div class="prose">${bodyOf(p)}</div>` +
    '<div class="cta">Like this? I write about AI, marketing and creative tools every week. ' +
    `Read more at <a href="${LINKS.blog}">the blog</a>.</div>` +
    '<div class="author">' +
    `<b>Written by ${escapeHtml(p.author || AUTHOR)}</b>` +
    '<span>Digital Marketer & AI Specialist, Kaithal</span>' +
    `<span>Content on AI-powered marketing, content strategy and creative tools. <a href="mailto:${LINKS.email.replace('mailto:', '')}">Get in touch</a>.</span>` +
    '</div>' +
    '</article>' +
    (relHtml
      ? '<section class="blog-wrap-rel" style="max-width:1100px;margin:48px auto 0;padding:0 20px 24px">' +
        relHtml +
        '<div class="row" style="padding-bottom:0">' +
        rel.map((r, i) => face(r, i, false)).join('') +
        '</div></section>'
      : '') +
    '<section class="cta2">' +
    '<h2>Want marketing like this for your business?</h2>' +
    '<p>Tell me what you are building and we can plan it together.</p>' +
    `<button class="btn" type="button" onclick="location.href='${LINKS.contact}'">Get in touch</button>` +
    '</section>';
}

main.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  if (btn.classList.contains('back')) location.href = '/blog';
  if (btn.classList.contains('btn')) location.href = LINKS.contact;
});

function tilt(target: HTMLElement, e: PointerEvent): void {
  if (calm || e.pointerType === 'touch') return;
  const card = target.closest('.card') as HTMLElement | null;
  if (!card) return;
  const f = card.firstElementChild as HTMLElement | null;
  if (!f) return;
  const r = card.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  f.style.setProperty('--ry', `${x * 18}deg`);
  f.style.setProperty('--rx', `${-y * 18}deg`);
}

function untilt(e: PointerEvent): void {
  if (calm) return;
  const card = (e.target as HTMLElement).closest('.card') as HTMLElement | null;
  if (!card || card.contains(e.relatedTarget as Node)) return;
  const f = card.firstElementChild as HTMLElement | null;
  if (!f) return;
  f.style.setProperty('--rx', '0deg');
  f.style.setProperty('--ry', '0deg');
}

main.addEventListener('pointermove', (e) => tilt(e.target as HTMLElement, e));
main.addEventListener('pointerout', untilt);

const footerEl = document.getElementById('site-footer') as HTMLElement | null;
if (footerEl) {
  renderFooter();
  footerEl.addEventListener('pointermove', (e) => tilt(e.target as HTMLElement, e));
  footerEl.addEventListener('pointerout', untilt);
}

const prog = document.getElementById('prog') as HTMLElement | null;
function onScroll(): void {
  if (!prog) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  prog.style.width = `${h > 0 ? (window.scrollY / h) * 100 : 0}%`;
}
window.addEventListener('scroll', onScroll, {passive: true});

async function boot(): Promise<void> {
  render();
  onScroll();
  try {
    const rows = await loadBlogPosts();
    if (rows && rows.length) {
      posts = rows;
      render();
      onScroll();
    }
  } catch {
    // seed copy already rendered
  }
}

boot();