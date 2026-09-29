import {submitContactMessage} from '../lib/contact';
import {loadBlogPosts, loadCapabilities, loadProjects, loadSiteContent} from '../lib/content';
import type {BlogPost, Capability, Project, SiteContent} from '../lib/content';
import {DEFAULT_PROJECTS} from '../lib/defaults';

/* ------------------------------------------------------------------ *
 * Bridge to the inline <script> IIFE in index.html.
 * The IIFE exposes {capabilitiesData, blogPostsData, projectsData,
 * renderBlogPosts, phrases} on window.__portfolio; everything below
 * mutates that state and lets the page's own renderers redraw.
 * ------------------------------------------------------------------ */

interface CapabilityToolEntry {
  name: string;
  svg: string;
}

interface CapabilityEntry {
  title: string;
  kicker: string;
  desc: string;
  tools: CapabilityToolEntry[];
}

interface BridgePost {
  slug: string;
  title: string;
  categoryKey: string;
  categoryLabel: string;
  date: string;
  readTime: string;
  excerpt: string;
  thumbSvg: string;
  contentHtml: string;
}

interface PortfolioBridge {
  capabilitiesData: Record<string, CapabilityEntry>;
  blogPostsData: BridgePost[];
  projectsData: Project[] | null;
  renderBlogPosts: (categoryFilter?: string) => void;
  phrases: string[];
}

const CATEGORY_KEYS = ['marketing', 'ai', 'strategy'];

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Digital Marketing & AI',
  ai: 'AI Tools & Motion',
  strategy: 'Content Strategy',
};

const NEUTRAL_DATE = 'Undated';
const NEUTRAL_READ_TIME = 'Article';
const NEUTRAL_CATEGORY = 'Article';

/* Neutral tool mark, sized like the hand-written brand SVGs (46x46). */
const GENERIC_TOOL_SVG =
  '<svg viewBox="0 0 24 24" width="46" height="46">' +
  '<rect width="24" height="24" rx="6" fill="#A31712"/>' +
  '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" fill="#FFF"/>' +
  '</svg>';

const NEUTRAL_THUMB_SVG =
  '<svg class="blog-post-thumb-svg" viewBox="0 0 400 210" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' +
  '<defs><linearGradient id="dbThumbGrad" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0%" stop-color="#FFF8F0"/><stop offset="100%" stop-color="#FDEEE9"/>' +
  '</linearGradient></defs>' +
  '<rect width="400" height="210" fill="url(#dbThumbGrad)"/>' +
  '<circle cx="200" cy="105" r="46" fill="none" stroke="#A31712" stroke-width="2" opacity="0.35"/>' +
  '<path d="M186 88 L186 122 L222 105 Z" fill="#A31712" opacity="0.5"/>' +
  '</svg>';

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

/** Coerce a DB scalar to a trimmed string. Returns '' for null/undefined/objects. */
function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && isFinite(value)) return String(value);
  return '';
}

/** Write to a node only when there is something to write. Never blanks existing copy. */
function setText(node: Element | null | undefined, value: string): boolean {
  const clean = text(value);
  if (!clean || !node) return false;
  node.textContent = clean;
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBridge(): PortfolioBridge | null {
  const candidate = (window as unknown as {__portfolio?: PortfolioBridge}).__portfolio;
  if (!candidate) return null;
  if (!Array.isArray(candidate.phrases)) return null;
  return candidate;
}

function siteField(content: SiteContent, field: string): string {
  return text((content as unknown as Record<string, unknown>)[field]);
}

/* ------------------------------------------------------------------ *
 * 1. Hero
 * ------------------------------------------------------------------ */

function applyHero(content: SiteContent, bridge: PortfolioBridge): void {
  const heroName = siteField(content, 'hero_name');
  if (heroName) {
    document.querySelectorAll('text.trail-stroke, text.name-fill-text').forEach(function (node) {
      node.textContent = heroName;
    });
  }

  const roles = (content.hero_roles || [])
    .map(function (role) {
      return text(role);
    })
    .filter(function (role) {
      return role.length > 0;
    });

  if (roles.length > 0) {
    bridge.phrases.length = 0;
    bridge.phrases.push.apply(bridge.phrases, roles);
    const typewriter = document.getElementById('typewriter');
    if (typewriter) typewriter.textContent = roles[0];
  }

  document.querySelectorAll('p.hero-tagline').forEach(function (node) {
    setText(node, siteField(content, 'hero_tagline'));
  });
}

/* ------------------------------------------------------------------ *
 * 2. Who Am I + Qualifications (scoped to #my-story)
 * ------------------------------------------------------------------ */

function applyStory(content: SiteContent): void {
  const story = siteField(content, 'who_am_i_story');
  if (story) {
    document.querySelectorAll('#my-story p.narrative-body').forEach(function (node) {
      setText(node, story);
    });
  }

  const cards = document.querySelectorAll('#my-story .roadmap-card');

  for (let i = 0; i < 3; i++) {
    const card = cards[i];
    if (!card) continue;
    const n = i + 1;

    setText(card.querySelector('.roadmap-title'), siteField(content, 'qualification_' + n + '_title'));
    setText(card.querySelector('.roadmap-takeaway'), siteField(content, 'qualification_' + n + '_desc'));

    const timing = siteField(content, 'qualification_' + n + '_timing');
    if (!timing) continue;

    let badge = card.querySelector('.roadmap-year-badge');
    const header = card.querySelector('.roadmap-card-header') as HTMLElement | null;

    if (!badge) {
      /* Card 3 ships without a year badge (header is justify-content:flex-end),
         so the badge has to be created or the DB timing would be invisible. */
      badge = document.createElement('span');
      badge.className = 'roadmap-year-badge';
      if (header) {
        header.insertBefore(badge, header.firstElementChild);
        if (header.style.justifyContent === 'flex-end') {
          header.style.justifyContent = 'space-between';
        }
      }
    }
    badge.textContent = timing;
  }
}

/* Journey panel (last block inside #my-story). Static markup is the fallback;
   DB text only ever lands via textContent, never as HTML. */
function applyJourney(content: SiteContent): void {
  const quotes = (content.journey_quotes || [])
    .map(function (entry) {
      return text(entry);
    })
    .filter(function (entry) {
      return entry.length > 0;
    });
  if (!quotes.length) return;

  const box = document.querySelector('#my-story .journey-box');
  const wrap = box ? box.querySelector('.journey-quotes-wrap') : null;
  if (!box || !wrap) return;

  const template = wrap.querySelector('blockquote.journey-quote');
  if (!template) return;

  /* 3+ entries: the last one becomes the closing narrative, the rest are quotes. */
  const asNarrative = quotes.length >= 3;
  const blockquotes = asNarrative ? quotes.slice(0, quotes.length - 1) : quotes.slice();

  while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

  blockquotes.forEach(function (quote) {
    const node = template.cloneNode(true) as HTMLElement;
    /* Assigning textContent drops the seeded .journey-quote-highlight span
       along with its text, so nothing from the fallback quote can linger. */
    node.textContent = quote;
    wrap.appendChild(node);
  });

  if (asNarrative) {
    const narrative = box.querySelector('p.journey-narrative');
    if (narrative) narrative.textContent = quotes[quotes.length - 1];
  }
}

/* ------------------------------------------------------------------ *
 * 3. Capabilities
 * ------------------------------------------------------------------ */

/** Keep a page-authored SVG (it carries the brand marks); fall back to a generic mark. */
function trustedToolSvg(svg: unknown): string {
  const raw = typeof svg === 'string' ? svg.trim() : '';
  if (!raw) return GENERIC_TOOL_SVG;
  const holder = document.createElement('div');
  holder.innerHTML = raw;
  const parsed = holder.querySelector('svg');
  return parsed ? parsed.outerHTML : raw;
}

function applyCapabilities(capabilities: Capability[], bridge: PortfolioBridge): void {
  const data = bridge.capabilitiesData;
  if (!data) return;

  const buttons = Array.prototype.slice.call(
    document.querySelectorAll('.capability-btn[data-category]'),
  ) as Element[];

  capabilities.forEach(function (capability) {
    if (!capability) return;
    const key = text(capability.key);
    if (!key) return;

    const existing = Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    if (!existing) return;

    const title = text(capability.title);
    if (title) {
      existing.title = title;
      buttons.forEach(function (button) {
        if (button.getAttribute('data-category') !== key) return;
        setText(button.querySelector('span'), title);
      });
    }

    const currentTools = Array.isArray(existing.tools) ? existing.tools : [];
    const incoming = Array.isArray(capability.tools) ? capability.tools : [];
    const rebuilt: CapabilityToolEntry[] = [];

    incoming.forEach(function (tool) {
      const name = tool ? text(tool.name) : '';
      if (!name) return;
      const match = currentTools.filter(function (candidate) {
        return text(candidate && candidate.name).toLowerCase() === name.toLowerCase();
      })[0];
      rebuilt.push({
        /* The modal builds its grid with string concatenation, so the label is
           pre-escaped here — it renders and reads back identically. */
        name: escapeHtml(name),
        svg: trustedToolSvg(match ? match.svg : ''),
      });
    });

    if (rebuilt.length > 0) existing.tools = rebuilt;
  });
}

/* ------------------------------------------------------------------ *
 * 4. Blog
 * ------------------------------------------------------------------ */

function categoryKeyFor(raw: string): string {
  const value = raw.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  if (!value) return '';
  if (CATEGORY_KEYS.indexOf(value) !== -1) return value;
  if (/\b(marketing|growth|ads|advertising|brand|seo)\b/.test(value)) return 'marketing';
  if (/\b(ai|motion)\b/.test(value)) return 'ai';
  if (/\b(strategy|strategic|content|editorial)\b/.test(value)) return 'strategy';
  return '';
}

function slugify(raw: string, fallback: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug) return slug;
  const alt = fallback
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return alt || 'post-' + fallback.replace(/[^a-z0-9]+/gi, '').toLowerCase().slice(0, 24);
}

/** Plain text -> safe HTML. Escape first, then add a tiny inline subset. */
function applyInline(line: string): string {
  let html = escapeHtml(line);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return html;
}

function buildContentHtml(raw: string, excerpt: string): string {
  const source = typeof raw === 'string' ? raw.replace(/\r\n/g, '\n') : '';
  const parts: string[] = [];

  source.split(/\n[ \t]*\n+/).forEach(function (block) {
    const lines = block.split('\n').map(function (line) {
      return line.replace(/[ \t]+$/, '');
    });
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    if (!lines.length) return;

    /* `# `, `## ` and `### ` all become <h3> — the only heading level
       styled inside .blog-modal-body, so DB copy matches the hardcoded posts. */
    const heading = /^(#{1,3})\s+(.+)$/.exec(lines[0]);
    let body = lines;

    if (heading) {
      const headingHtml = applyInline(heading[2]);
      if (headingHtml.trim()) parts.push('<h3>' + headingHtml + '</h3>');
      body = lines.slice(1);
    }

    /* Single newlines inside a block stay inside one paragraph as <br>. */
    const paragraph = body
      .map(applyInline)
      .filter(function (line) {
        return line.trim().length > 0;
      })
      .join('<br>');
    if (paragraph) parts.push('<p>' + paragraph + '</p>');
  });

  if (!parts.length) {
    const fallback = applyInline(excerpt);
    return fallback.trim() ? '<p>' + fallback + '</p>' : '';
  }
  return parts.join('');
}

function buildThumb(thumbnailUrl: string): string {
  const url = text(thumbnailUrl);
  if (!url) return NEUTRAL_THUMB_SVG;
  if (!/^https?:\/\/\S+$/i.test(url)) return NEUTRAL_THUMB_SVG;
  return (
    '<img class="blog-post-thumb-svg" src="' +
    escapeHtml(url) +
    '" alt="" loading="lazy" style="object-fit: cover;" />'
  );
}

function toBridgePost(post: BlogPost): BridgePost | null {
  const title = text(post && post.title);
  if (!title) return null;

  const rawCategory = text(post.category);
  const categoryKey = categoryKeyFor(rawCategory);
  const categoryLabel = rawCategory
    ? escapeHtml(rawCategory)
    : text(CATEGORY_LABELS[categoryKey]) || NEUTRAL_CATEGORY;
  const excerpt = text(post.excerpt);

  return {
    slug: slugify(text(post.slug), title),
    title: escapeHtml(title),
    categoryKey: categoryKey,
    categoryLabel: categoryLabel,
    date: escapeHtml(text(post.date)) || NEUTRAL_DATE,
    readTime: escapeHtml(text(post.read_time)) || NEUTRAL_READ_TIME,
    excerpt: escapeHtml(excerpt),
    thumbSvg: buildThumb(post.thumbnail_url),
    contentHtml: buildContentHtml(text(post.content), excerpt),
  };
}

function applyBlog(posts: BlogPost[], bridge: PortfolioBridge): void {
  const existing = bridge.blogPostsData;
  if (!Array.isArray(existing) || typeof bridge.renderBlogPosts !== 'function') return;

  let changed = false;

  posts.forEach(function (post) {
    const incoming = toBridgePost(post);
    if (!incoming) return;

    const index = existing.findIndex(function (entry) {
      return entry && entry.slug === incoming.slug;
    });

    if (index !== -1) {
      existing[index] = incoming;
    } else {
      existing.push(incoming);
    }
    changed = true;
  });

  if (changed) bridge.renderBlogPosts('all');
}

/* ------------------------------------------------------------------ *
 * 5. Contact
 * ------------------------------------------------------------------ */

function findContactAnchor(match: (href: string) => boolean): HTMLAnchorElement | null {
  const anchors = Array.prototype.slice.call(
    document.querySelectorAll('a.contact-item'),
  ) as HTMLAnchorElement[];
  return (
    anchors.filter(function (anchor) {
      return match(anchor.getAttribute('href') || '');
    })[0] || null
  );
}

function findFooterLink(match: (href: string) => boolean): HTMLAnchorElement | null {
  const anchors = Array.prototype.slice.call(
    document.querySelectorAll('footer a.footer-icon-link'),
  ) as HTMLAnchorElement[];
  return (
    anchors.filter(function (anchor) {
      return match(anchor.getAttribute('href') || '');
    })[0] || null
  );
}

function applyContact(content: SiteContent): void {
  const emailAnchor = document.querySelector('a.contact-item[href^="mailto:"]') as HTMLAnchorElement | null;
  const linkedinAnchor = findContactAnchor(function (href) {
    return href.toLowerCase().indexOf('linkedin') !== -1;
  });

  const email = siteField(content, 'contact_email').replace(/^mailto:/i, '').trim();
  if (email && emailAnchor) {
    setText(emailAnchor.querySelector('.contact-value'), email);
    emailAnchor.setAttribute('href', 'mailto:' + email);
    const footerEmail = findFooterLink(function (href) {
      return href.toLowerCase().indexOf('mailto:') === 0;
    });
    if (footerEmail) footerEmail.setAttribute('href', 'mailto:' + email);
  }

  const linkedin = siteField(content, 'contact_linkedin');
  if (linkedin && linkedinAnchor) {
    const path = linkedin.replace(/^https?:\/\//i, '').trim();
    const href = 'https://' + path;
    setText(linkedinAnchor.querySelector('.contact-value'), path);
    linkedinAnchor.setAttribute('href', href);
    const footerLinkedin = findFooterLink(function (value) {
      return value.toLowerCase().indexOf('linkedin') !== -1;
    });
    if (footerLinkedin) footerLinkedin.setAttribute('href', href);
  }

  const phone = siteField(content, 'contact_phone');
  if (phone && emailAnchor && linkedinAnchor && linkedinAnchor.parentNode) {
    const digits = phone.replace(/[^\d+]/g, '');
    if (digits) {
      const card = emailAnchor.cloneNode(true) as HTMLAnchorElement;
      card.setAttribute('href', 'tel:' + digits);
      card.removeAttribute('target');
      card.removeAttribute('rel');
      setText(card.querySelector('.contact-label'), 'Phone');
      setText(card.querySelector('.contact-value'), phone);
      linkedinAnchor.parentNode.insertBefore(card, linkedinAnchor.nextSibling);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 6. Projects + Vision
 * ------------------------------------------------------------------ */

/** Shallow-clone the shipped row (keeps its attributes), then rebuild the
    children. Server copy only ever lands via textContent. */
function buildBenefitItem(template: Element, benefit: string): HTMLLIElement {
  const item = template.cloneNode(false) as HTMLLIElement;
  item.className = 'benefit-keypoint-row';

  const dot = document.createElement('span');
  dot.className = 'benefit-dot-bullet';

  const body = document.createElement('div');
  const raw = text(benefit);
  const split = raw.indexOf(': ');

  if (split === -1) {
    body.textContent = raw;
  } else {
    const label = document.createElement('strong');
    label.textContent = raw.slice(0, split) + ':';
    body.appendChild(label);
    body.appendChild(document.createTextNode(' ' + raw.slice(split + 2)));
  }

  item.appendChild(dot);
  item.appendChild(body);
  return item;
}

function applyBenefits(list: Element | null, benefits: string[]): void {
  if (!list) return;

  const incoming = benefits
    .map(function (benefit) {
      return text(benefit);
    })
    .filter(function (benefit) {
      return benefit.length > 0;
    });
  if (!incoming.length) return;

  const items = Array.prototype.slice.call(list.querySelectorAll('li')) as HTMLLIElement[];
  if (!items.length) return;

  const template = items[items.length - 1];

  incoming.forEach(function (benefit, index) {
    const built = buildBenefitItem(template, benefit);
    const existing = items[index];
    if (existing) {
      list.replaceChild(built, existing);
    } else {
      list.appendChild(built);
    }
  });

  /* Fewer benefits than the shipped list: drop the rows nothing maps to. */
  items.slice(incoming.length).forEach(function (extra) {
    if (extra && extra.parentNode) extra.parentNode.removeChild(extra);
  });
}

/* The .project-box-preview-light mockups and the AI Videos wrapper are
   page-authored art, so they are deliberately left alone here. */
function applyProjectRow(row: Element, project: Project): void {
  if (!project) return;

  const kicker = row.querySelector('.project-box-kicker');
  if (kicker) {
    const spans = kicker.querySelectorAll('span');
    setText(spans[spans.length - 1], text(project.kicker));
  }

  setText(row.querySelector('.project-box-title > span'), text(project.title));

  const url = text(project.url);
  if (url) {
    const action = row.querySelector('.project-box-action-btn');
    if (action) action.setAttribute('href', url);

    const fallback = row.querySelector('.project-live-fallback-link');
    if (fallback) fallback.setAttribute('href', url);

    const frame = row.querySelector('.project-live-frame iframe');
    if (frame) frame.setAttribute('src', url);
  }

  setText(row.querySelector('.beneficial-title'), text(project.beneficial_title));

  const benefits = Array.isArray(project.benefits) ? project.benefits : [];
  if (benefits.length) {
    applyBenefits(row.querySelector('.benefit-keypoints-list'), benefits);
  }
}

function applyProjectsHeader(content: SiteContent | null): void {
  if (!content) return;

  setText(
    document.querySelector('#projects .projects-header .section-label'),
    siteField(content, 'projects_label'),
  );
  setText(document.querySelector('#projects .projects-header h2'), siteField(content, 'projects_heading'));
  setText(document.querySelector('#projects .projects-header p'), siteField(content, 'projects_subtitle'));
}

function applyProjects(projects: Project[] | null, content: SiteContent | null): void {
  applyProjectsHeader(content);

  const source = Array.isArray(projects) && projects.length > 0 ? projects : DEFAULT_PROJECTS;

  const rows = Array.prototype.slice.call(
    document.querySelectorAll('#projects .project-showcase-row'),
  ) as Element[];

  source
    .slice()
    .sort(function (a, b) {
      return (a.position || 0) - (b.position || 0);
    })
    .forEach(function (project, index) {
      const row = rows[index];
      if (!project || !row) return;
      applyProjectRow(row, project);
    });
}

function applyVision(content: SiteContent): void {
  setText(document.querySelector('.vision-subheading'), siteField(content, 'vision_subheading'));
  setText(document.querySelector('.vision-headline'), siteField(content, 'vision_headline'));
  setText(document.querySelector('.vision-paragraph'), siteField(content, 'vision_paragraph'));
}

/* ------------------------------------------------------------------ *
 * Boot — the loaders already resolve to null on error/timeout/no config,
 * so a null result simply means "leave the page exactly as it is".
 * ------------------------------------------------------------------ */

function run(): void {
  const bridge = getBridge();
  if (!bridge) return;

  Promise.all([loadSiteContent(), loadCapabilities(), loadBlogPosts(), loadProjects()]).then(function (
    results,
  ) {
    const content = results[0];
    const capabilities = results[1];
    const posts = results[2];
    const projects = results[3];

    if (content) {
      applyHero(content, bridge);
      applyStory(content);
      applyJourney(content);
      applyContact(content);
      applyVision(content);
    }
    applyProjects(projects ?? bridge.projectsData, content);
    if (capabilities && capabilities.length > 0) {
      applyCapabilities(capabilities, bridge);
    }
    if (posts && posts.length > 0) {
      applyBlog(posts, bridge);
    }
  });
}

/* ------------------------------------------------------------------ *
 * Contact form — the inline <script> in index.html owns the DOM/UI but
 * cannot import modules, so the actual Supabase write is exposed here.
 * ------------------------------------------------------------------ */

type ContactSubmit = (input: {name: string; email: string; message: string}) => Promise<
  {ok: true; notify?: 'sent' | 'stored-only' | 'failed'} | {ok: false; error: string}
>;

const contactGlobal = window as unknown as {__portfolioSubmitContact?: ContactSubmit};
contactGlobal.__portfolioSubmitContact = submitContactMessage;

run();
