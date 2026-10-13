# SEO Changes — Every Change Made

Commits (in order):
1. `43f8b60` — seo: add before-state audit (SEO_AUDIT.md)
2. `831a2c2` — seo: fix titles/canonicals, social links, mailto, add manifest and 404
3. `c05f5f5` — seo: add BreadcrumbList and BlogPosting image schema
4. `ce59161` — seo: add service pages, homepage services section, footer links
5. `ef55fea` — seo: improve blog titles, add service internal links, draft local SEO post
6. *(next)* — seo: analytics placeholders, non-blocking fonts, deliverables

---

## Step 1 — Audit
- **New:** `SEO_AUDIT.md` — before-state audit (title/desc per page, H1 issues, missing canonicals, stale sitemap, heavy files, broken social links, mailto typo, missing manifest/404, blog breakdown, no GA4/Bing).

## Step 2 — Technical SEO
- `.env` — `SITE_URL` placeholder → `https://sakshigill.com` (gitignored; **Vercel env var still needed**, see MANUAL_TODO).
- `index.html` (home):
  - Title → `Sakshi Gill | AI Developer & Digital Marketer | Kaithal` (53 chars, was 72).
  - Meta description → focused, ~150 chars.
  - og:title/twitter:title/description rewritten to match.
  - og:image kept as `sakshi_portrait.jpg` (1376×768, 16:9) + explicit `og:image:width/height/alt`.
  - Fixed both social links `https://linkedin.com` → `linkedin.com/in/sakshigill`, `https://github.com` → `github.com/divine0311` (contact + footer).
  - Fixed broken mailto `divinesakshi03gmail.com@gmail.com` → `divinesakshi03@gmail.com` (contact, footer, fallback email + `src/lib/defaults.ts` + `src/site/blogSeed.ts`).
  - Blog section H1 → H2, so the page has exactly one H1 (hidden hero H1 carries name/role/location).
  - Added `<link rel="manifest" href="/site.webmanifest" />`.
- `public/site.webmanifest` **new** — name, icons, theme/background colors.
- `public/404.html` **new** — branded 404 with link home (`noindex, follow`). Vercel auto-serves it with a real 404 status.
- `public/robots.txt` — sitemap → real domain (`sakshigill.com`), removed deprecated `Crawl-delay`, kept admin/api disallows + asset allows.
- **Deleted** (user-approved): `public/sakshi-video.mp4` (22 MB, unused), `public/port-video-1.mp4` (2 MB, unused), `public/port-video-poster.jpg` (unused), `public/Character_head_tracking_animation_20260923172045.jpeg` (unused), `public/sitemap.xml` (stale — now generated at build only).
- `scripts/prerender-blog.mjs` — og:image + og:site_name added to the OG block injected into every blog page.

## Step 3 — Structured data (JSON-LD)
- `index.html` — Person updated: `alternateName` now includes **"Sakshi Kaithal"**, `jobTitle` "AI Developer, Digital Marketer & Photo-Video Editor", `knowsAbout` + AI Development + Photo Editing. WebSite/ProfilePage descriptions aligned.
- `public/json-ld.json` — same Person fixes (kept consistent).
- `scripts/prerender-blog.mjs` — blog listing now emits **Blog + BreadcrumbList** (`@graph`); each post emits **BlogPosting + BreadcrumbList** (`@graph`) with `image`, and publisher Person now has `image`. All blocks validated with `JSON.parse`.
- Home already had FAQPage, Person, WebSite, ProfilePage (verified valid).

## Step 4 — On-page content + service pages
- **New pages:** `ai-developer.html`, `digital-marketer.html`, `editor.html` — each a self-contained brand-styled page with unique title/H1/meta, Service + BreadcrumbList JSON-LD, ~300+ words of genuine content, CTA to `/#connect`, and cross-links to the other two services.
- `index.html` — new visible **#services section** (3 cards: AI Developer, Digital Marketer, Photo & Video Editor) with short role blurbs + links to each page; "Services" pill added to floating nav; `services` id added to the scroll-spy `sectionIds`; footer now links the three service pages.
- `vite.config.ts` — service pages added to build input + dev/preview route rewrites (`/ai-developer`, `/digital-marketer`, `/editor`).
- `vercel.json` — rewrites for the three service paths (+ `/404`), alongside the existing admin/blog rewrites.
- `scripts/prerender-blog.mjs` — sitemap.xml now includes the three service pages.

## Step 5 — Blog improvement
- `src/site/blogSeed.json` — two weak titles rewritten to lead with the keyword: "Best Communicator in Kaithal: Clear Words That Win Clients", "Best Chatbot Creator in Kaithal: Answers 24/7" (+ matching `meta_title`).
- `src/site/blogPost.ts` + `scripts/prerender-blog.mjs` — added a category-based **"Looking for this?" internal link** (`go-deeper`) on every post pointing to the matching service page (Digital Marketing → /digital-marketer, AI Tools → /ai-developer, Editing → /editor, Web Design → /ai-developer); inter-post links already existed via the build-time "Related Articles" block.
- `src/site/blog.css` — `.go-deeper` box style (matches the new dark theme).
- **New:** `content/drafts/google-business-profile-kaithal-checklist.md` — first draft targeting "Google Business Profile Kaithal" / local SEO, **not published**.
- `SEO_AUDIT.md` — added full per-post analysis table + 5 new post ideas.

## Step 6 — Images / performance
- Heavy unused videos removed (Step 2) → dist dropped from ~24 MB to **6.25 MB**.
- Homepage hero image is absolute-positioned (no layout shift); no below-the-fold `<img>` exists to lazy-load; the one real img already has `alt`.
- Render-blocking Google Fonts made async via `media="print" onload="this.media='all'"` on home + both blog templates (same fonts, no visual change).
- og:image compression to a crisp 1200×630 version is a manual todo (needs an image tool).

## Step 7 — Analytics + verification placeholders
- `index.html`, `blog.html`, `blog-post.html`, `ai-developer.html`, `digital-marketer.html`, `editor.html` — added commented Bing Webmaster verification placeholder and a **GA4 script that loads only in production and only when a real measurement ID is set** (placeholder `G-XXXXXXXXXX`, never ships a tracking call until edited). No real IDs in the repo.

## Visible changes (as allowed by the task)
- New #services section + "Services" nav pill on the homepage.
- Footer service links.
- Font loading mode (async) — identical fonts, momentary unstyled-text possible on very slow connections.
- Blog post titles inside post pages (keyword-led, in line with card/filter UI).