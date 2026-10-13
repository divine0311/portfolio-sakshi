# SEO Audit — Sakshi Gill Portfolio (sakshigill.com)

Date: 2026-10-13 · Framework: **Vite 8 multi-page static site** (React 19 used only in the admin panel).
Build/deploy: `npm run build` (`vite build` + `scripts/prerender-blog.mjs`) → Vercel (`vercel.json`).
Live domain: **https://sakshigill.com** (from `public/sitemap.xml`; `.env` `SITE_URL` is still a placeholder!).

---

## Pages & routes

| Route | Source | Notes |
|---|---|---|
| `/` | `index.html` | Home — hero, my story, projects, capabilities, journey, connect |
| `/blog` | `blog.html` | Blog listing, prerendered to `dist/blog/index.html` |
| `/blog/<slug>` | `blog-post.html` | One static page per post (8 seed posts) |
| `/admin` | `admin.html` | Private admin panel — blocked in `robots.txt` |

No `/about`, `/ai-developer`, `/digital-marketer`, or `/editor` pages exist yet.

---

## Current per-page SEO

### Home `index.html`
- **Title** (72 chars — too long): `Sakshi Gill — Digital Marketer, AI Developer & Creative Strategist in Kaithal`
- **Meta description**: present, good length (~165 chars).
- **Canonical**: `__SITE_URL__/` — placeholder, injected at build by prerender.
- **H1s**: TWO — sr-only hero H1 `Sakshi Gill — Digital Marketer, AI Developer & Creative Strategist in Kaithal, Haryana` AND a **visible** `<h1 class="blog-main-title">` "Stories, Strategy & AI Craft" (line 4175). Violates one-H1-per-page.
- **Robots meta** (index/follow/max-image-preview): good. **Geo meta** (Kaithal coords): good.
- **OG + Twitter**: present but og:image is `sakshi_portrait.jpg` (613 KB portrait, not 1200×630).
- **JSON-LD**: Person + WebSite + ProfilePage inline (valid). `public/json-ld.json` also linked via `<link rel="alternate">` — this alternate-link method is **not** a supported schema injection and does nothing; the inline block is what matters.
- **GSC verification meta**: a real key is committed (fine to keep, it's public verification).
- **Lang/en + viewport**: correct.
- Favicon `favicon.svg` present; apple-touch-icon points to a 613 KB portrait JPG (should be a dedicated 180×180 PNG). **No `site.webmanifest`.**

### Blog listing `blog.html` (prerendered)
- Title: `Blog | Sakshi Gill – Digital Marketer in Kaithal` (good).
- Meta description: good. Canonical `/blog` → prerender rewrites to absolute. OG/Twitter injected at build by `applyHead`.
- H1: none in template (cards are added at build). OK.

### Blog post `blog-post.html` (prerendered)
- Template title `Sakshi Gill | Blog` → replaced per-post at build. Meta description replaced per-post. Canonical/OG inserted at build (missing in template but handled).
- **No BreadcrumbList** schema.

### Admin `admin.html`
- Intentionally private, noindex via `robots.txt`. Fine.

---

## Issues found

### Critical
1. **`SITE_URL` is a placeholder** in `.env` (`https://YOUR-DOMAIN-HERE`). Prerender injects it into every canonical, og:url, JSON-LD and `sitemap.xml`. Unless Vercel has `SITE_URL` env var set, the live site ships **localhost URLs** for all of these. Must set `SITE_URL=https://sakshigill.com`.
2. **`public/sitemap.xml` is stale and wrong**: lists old slugs (`ai-video-storytelling-mastery`, `mastering-prompt-architecture`, …) that are not the current posts; uses fragment URLs (`/#projects`, `/#my-story` — Google ignores fragments); references unused `port-video-1.mp4`. The build-time prerender regenerates a correct sitemap, so this file is only a source-copy hazard — embed real domain into env instead.
3. **Two H1s on the homepage** (visible blog section title + hidden hero H1).

### High
4. **Unused heavy videos shipped to production**: `public/sakshi-video.mp4` (**22 MB**, referenced nowhere) and `public/port-video-1.mp4` (2 MB, only in stale sitemap) are copied into `dist/` on every build → slow deploys/pages. `hero-portfolio.mp4` (2 MB) is the actual hero.
5. **Social links point to generic sites**, not profiles: footer + contact `href="https://linkedin.com"` and `https://github.com` (display text shows the real handle). sameAs JSON-LD only has LinkedIn + GitHub (both to fix redirect targets too).
6. **og:image is portrait `.jpg` (613 KB), not 1200×630** — shared cards will crop badly.
7. **apple-touch-icon** uses a 613 KB photo; **no `site.webmanifest`**.

### Medium
8. **No GA4, no Bing Webmaster verification** (GSC meta exists).
9. No role/service pages (`/ai-developer`, `/digital-marketer`, `/editor`) — all content is one long homepage.
10. No **BreadcrumbList** schema (only Person/WebSite/ProfilePage on home; blog posts get BlogPosting via prerender).
11. **`blog-post.html` template lacks canonical/OG** entirely — relies on prerender's `</head>` injection (works, but the template is fragile).
12. Old editors/keywords mention "Editor" but never state the specialization clearly (video vs photo vs content). Site content says **video editing (InShot/CapCut/VN)** — use "Video Editor" consistently.
13. `robots.txt` has `Crawl-delay` (Bing deprecated it; Google ignores) and blocks `/*.json$`/`*.md$`/`src/` — harmless but noisy. The static copy in `public/` is overwritten by prerender anyway; update the source too.

### Low
14. Only one real `<img>` on the homepage (has `alt="Sakshi Gill Character Animation"` — could be more descriptive).
15. Google Fonts CSS is render-blocking (no `media="print"` trick / no system fallback preloads). Two separate font loads (home + blog).
16. Blog post bodies have zero internal cross-links between posts or to service sections.
17. Blog cards/hero images are CSS/glyph-based — no image alt concerns, but OGP needs a 1200×630 image.
18. No custom 404 page (Vercel default).

---

## Popular blog topics currently covered (8 seed posts)
Good Communicator / Chatbot Creator / Content Creator / Web Designer / Digital Marketer / AI Toolkit / Video Editor / Content Strategist — all "in Kaithal" flavored. No **OGP image**, no **BreadcrumbList**, no **internal links between posts**, no **title/meta duplication** (all unique).

---

## What's already good (baseline)
- Descriptive, unique titles/meta per post.
- `lang="en"`, viewport, robots meta, geo meta on home.
- Inline Person/WebSite/ProfilePage JSON-LD.
- Build-time sitemap/robots generation (once SITE_URL is set).
- Alt text on the one real image; lazy/hidden content is script-rendered but prerendered HTML is crawlable.