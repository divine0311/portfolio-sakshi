/**
 * Blog listing, ported from APPENDIX A into the existing vanilla-TS stack.
 *
 * Everything visible is derived from Supabase: the counts, the category pills,
 * the search index, the cards and the pagination. Admin Panel edits appear on
 * the next load with no code change. Only published posts are listed.
 */
import './blog.css';
import {loadBlogPosts} from '../lib/content';
import type {BlogPost} from '../lib/content';
import {
  AUTHOR,
  BLOG_SEED,
  CATEGORY_ORDER,
  LINKS,
  PER_PAGE,
  categoryGlyph,
  categoryStyle,
} from './blogSeed';
import {renderFooter} from './blogFooter';

const app = document.getElementById('app') as HTMLElement;

const LIST_TITLE = 'Blog | Sakshi Gill – Digital Marketer in Kaithal';
const LIST_DESC =
  'Insights on AI-powered marketing, content strategy and creative tools from Kaithal’s digital marketing specialist.';

let posts: BlogPost[] = BLOG_SEED.slice();
let cat = 'All';
let q = '';
let page = 1;
let firstRender = true;

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isPublished(p: BlogPost): boolean {
  // Absent column on a legacy row means published.
  return p.published !== false;
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

function setMeta(desc: string): void {
  let el = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!el) {
    el = document.createElement('meta');
    el.name = 'description';
    document.head.appendChild(el);
  }
  el.setAttribute('content', desc);
}

function categoriesInUse(): string[] {
  const seen: string[] = [];
  posts.forEach((p) => {
    if (p.category && !seen.includes(p.category)) seen.push(p.category);
  });
  // Keep the designed order first, then anything new from the Admin Panel.
  const known = CATEGORY_ORDER.filter((c) => seen.includes(c));
  const extra = seen.filter((c) => !CATEGORY_ORDER.includes(c));
  return [...known, ...extra];
}

function filtered(): BlogPost[] {
  const needle = q.trim().toLowerCase();
  return posts.filter((p) => {
    if (!isPublished(p)) return false;
    if (cat !== 'All' && p.category !== cat) return false;
    if (!needle) return true;
    return `${p.title} ${descOf(p)} ${p.category || ''}`.toLowerCase().includes(needle);
  });
}

function cardHtml(p: BlogPost, i: number): string {
  const faces = Array.from({length: 6}, () => `<i>${categoryGlyph(p.category)}</i>`).join('');
  const read = p.read_time || '';
  return (
    `<a class="card" style="${categoryStyle(p.category)};--i:${i}" href="/blog/${p.slug}">` +
    '<div class="face">' +
    '<div class="bg"></div>' +
    `<span class="tag">${escapeHtml(p.category || 'Article')}</span>` +
    `<div class="cube">${faces}</div>` +
    '<span class="orb2"></span>' +
    '<div class="panel">' +
    `<h3>${escapeHtml(p.title)}</h3>` +
    `<div class="meta">${escapeHtml(read)} • ${escapeHtml(AUTHOR)}</div>` +
    '<span class="more">Read More →</span>' +
    '</div></div></a>'
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function list(): void {
  const all = filtered();
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  if (page > pages) page = pages;
  const shown = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const cats = categoriesInUse();
  const pills = ['All', ...cats]
    .map(
      (c) =>
        `<button class="pill${c === cat ? ' on' : ''}" data-c="${escapeHtml(c)}" type="button">${escapeHtml(c)}</button>`,
    )
    .join('');

  const numbers = Array.from(
    {length: pages},
    (_, i) =>
      `<button class="${i + 1 === page ? 'cur' : ''}" data-p="${i + 1}" type="button">${i + 1}</button>`,
  ).join('');

  const liveCount = posts.filter(isPublished).length;
  const catCount = new Set(posts.filter(isPublished).map((p) => p.category).filter(Boolean)).size;

  app.innerHTML =
    `<header class="${firstRender ? 'go' : ''}">` +
    "<div class=\"label\">Kaithal's Trusted Digital Marketing Voice</div>" +
    '<h1 class="hero serif">Learn. Create. Grow.</h1>' +
    '<p class="lede">Insights on AI-powered marketing, content strategy, and creative tools — from Kaithal’s digital marketing specialist.</p>' +
    '<div class="stats">' +
    `<div class="stat"><b>${liveCount}</b><span>Articles</span></div>` +
    `<div class="stat"><b>${catCount}</b><span>Categories</span></div>` +
    '<div class="stat"><b>AI</b><span>Powered</span></div>' +
    '</div></header>' +
    `<input id="q" class="search" type="search" placeholder="Search articles" value="${escapeHtml(q)}" aria-label="Search articles">` +
    `<div class="pills" role="group" aria-label="Filter by category">${pills}</div>` +
    `<p class="count">${all.length} article${all.length === 1 ? '' : 's'} published</p>` +
    '<div class="arrs">' +
    '<button data-s="-1" type="button" aria-label="Scroll left">‹</button>' +
    '<button data-s="1" type="button" aria-label="Scroll right">›</button>' +
    '</div>' +
    '<div class="row">' +
    (shown.length ? shown.map(cardHtml).join('') : '<div class="empty">No articles in this category yet.</div>') +
    '</div>' +
    '<nav class="pg" aria-label="Pagination">' +
    `<button data-p="${page - 1}" type="button" ${page === 1 ? 'disabled' : ''}>← Prev</button>` +
    numbers +
    `<button data-p="${page + 1}" type="button" ${page === pages ? 'disabled' : ''}>Next →</button>` +
    `<span>Page ${page} of ${pages}</span>` +
    '</nav>' +
    '<section class="cta2">' +
    '<h2>Ready to grow your business in Kaithal?</h2>' +
    '<p>Tell me about your business and get a simple, honest plan.</p>' +
    `<button class="btn" type="button" onclick="location.href='${LINKS.contact}'">Get in touch</button>` +
    '</section>';

  firstRender = false;
  document.title = LIST_TITLE;
  setMeta(LIST_DESC);
}

/* ---------- interactions ---------- */

app.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  if (btn instanceof HTMLButtonElement && btn.classList.contains('btn')) return;

  const c = btn.getAttribute('data-c');
  if (c !== null) {
    cat = c;
    page = 1;
    list();
    return;
  }
  const p = btn.getAttribute('data-p');
  if (p !== null) {
    page = Number(p);
    list();
    const row = app.querySelector('.row');
    if (row) row.scrollTo({left: 0, behavior: 'smooth'});
    return;
  }
  const s = btn.getAttribute('data-s');
  if (s !== null) {
    const row = app.querySelector('.row');
    if (row) row.scrollBy({left: Number(s) * 310, behavior: 'smooth'});
  }
});

app.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.id !== 'q') return;
  q = input.value;
  page = 1;
  const caret = input.selectionStart;
  list();
  const next = document.getElementById('q') as HTMLInputElement | null;
  if (next) {
    next.focus();
    const pos = caret ?? next.value.length;
    next.setSelectionRange(pos, pos);
  }
});

/* ---------- mouse tilt ---------- */

function tilt(target: HTMLElement, e: PointerEvent): void {
  if (calm || e.pointerType === 'touch') return;
  const card = (target as HTMLElement).closest('.card') as HTMLElement | null;
  if (!card) return;
  const face = card.firstElementChild as HTMLElement | null;
  if (!face) return;
  const r = card.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  face.style.setProperty('--ry', `${x * 18}deg`);
  face.style.setProperty('--rx', `${-y * 18}deg`);
}

function untilt(e: PointerEvent): void {
  if (calm) return;
  const card = (e.target as HTMLElement).closest('.card') as HTMLElement | null;
  if (!card || card.contains(e.relatedTarget as Node)) return;
  const face = card.firstElementChild as HTMLElement | null;
  if (!face) return;
  face.style.setProperty('--rx', '0deg');
  face.style.setProperty('--ry', '0deg');
}

app.addEventListener('pointermove', (e) => tilt(e.target as HTMLElement, e));
app.addEventListener('pointerout', untilt);

const footerEl = document.getElementById('site-footer') as HTMLElement | null;
if (footerEl) {
  renderFooter();
  footerEl.addEventListener('pointermove', (e) => tilt(e.target as HTMLElement, e));
  footerEl.addEventListener('pointerout', untilt);
  footerEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-fc]');
    if (!btn) return;
    cat = btn.getAttribute('data-fc') || 'All';
    page = 1;
    q = '';
    list();
    window.scrollTo({top: 0, behavior: 'smooth'});
  });
}

/* ---------- reading progress ---------- */

const prog = document.getElementById('prog') as HTMLElement | null;
window.addEventListener(
  'scroll',
  () => {
    if (!prog) return;
    if (!document.querySelector('article')) {
      prog.style.width = '0';
      return;
    }
    const h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = `${h > 0 ? (window.scrollY / h) * 100 : 0}%`;
  },
  {passive: true},
);

/* ---------- boot ---------- */

async function boot(): Promise<void> {
  list();
  try {
    const rows = await loadBlogPosts();
    if (rows && rows.length) {
      // Newest first, as specified.
      posts = rows.slice().sort((a, b) => (dateOf(b) < dateOf(a) ? -1 : 1));
      page = 1;
      list();
    }
  } catch {
    // seed copy already rendered
  }
}

boot();