# MANUAL TODO — Things you must do yourself

Work through these in order. Items 1–2 unlock indexing; 3–4 unlock analytics; the rest grow authority and consistency.

## 1. Set the production URL on Vercel (critical — do today)
- Vercel → project → **Settings → Environment Variables** → add:
  - `Name: SITE_URL` · `Value: https://sakshigill.com` · environments: Production (+ Preview/Development if you want).
- Then redeploy. Until this is set, the build on Vercel has **no SITE_URL** and every canonical/og:url/sitemap URL would point at localhost. (My local `.env` now has it, but `.env` is gitignored so Vercel cannot see it.)

## 2. Google Search Console (GSC)
- A verification meta tag is already on the site (`google-site-verification` …`xuwQ…_4`), so verification may already be active. If not: verify https://sakshigill.com via the meta tag route.
- Submit sitemap: **https://sakshigill.com/sitemap.xml**.
- Request indexing (URL inspection → Request Indexing) for: `/`, `/blog`, `/ai-developer`, `/digital-marketer`, `/editor`.

## 3. Bing Webmaster Tools
- Sign in at bing.com/webmasters (import from GSC if you like).
- Paste your verification code into the `bing-site-verification` meta tag I added to every page (currently `PASTE-BING-VERIFICATION-CODE-HERE`), commit + deploy.
- Submit sitemap: **https://sakshigill.com/sitemap.xml**.

## 4. Google Analytics 4
- Create a GA4 property → copy the **Measurement ID** (`G-…`).
- Replace every `'G-XXXXXXXXXX'` in the snippet on `index.html`, `blog.html`, `blog-post.html`, and the three service pages. The snippet is a placeholder that does nothing until a real ID is set; it only runs in production (never localhost). Commit + deploy.

## 5. Supabase migrations for the blog + admin content (if not already run)
- `supabase/admin-panel-v2.sql`, `supabase/admin-security.sql`, `supabase/part-b-images.sql` — new site_content/project fields.
- `supabase/blog-modernisation.sql` — adds `published`/`author` columns so Supabase can host blog posts (the static site currently ships the 8 seed posts because the table is empty and the `published` column is missing).

## 6. Fix the admin login situation
- Either sign up via the admin panel's "First time here? Create admin account" flow, or invite `divinesakshi03@gmail.com` from Supabase → Authentication → Users.

## 7. Consistent name/role across profiles (helps E-E-A-T + the "Sakshi Gill / Sakshi Kaithal" brand)
- LinkedIn: linkedin.com/in/sakshigill — set headline `AI Developer | Digital Marketer | Photo & Video Editor | Kaithal, Haryana`.
- GitHub: github.com/divine0311 — same name + a link back to sakshigill.com in the bio/README.
- Use the same spelling **"Sakshi Gill"** everywhere; candidate alt name **"Sakshi Kaithal"** on local-facing bios.
- When you add Instagram / X / Behance / Medium / Dev.to later, open `index.html` and add them to the Person `sameAs` array (and `public/json-ld.json`) so search engines connect the profiles.

## 8. Compress the OG/portfolio image (nice-to-have)
- `public/sakshi_portrait.jpg` is 613 KB and used as og:image + apple-touch-icon + Person image.
- Re-export a compressed **1200×630** (og) and a **180×180 PNG** (apple-touch-icon) and reference those; it trims page weight and makes shared cards crisper.

## 9. Local brand authority (optional but recommended)
- If you offer local services in Kaithal, create a **Google Business Profile** and link it from the /digital-marketer page content.
- Ask 3–5 real clients/colleagues who know your work to leave reviews on LinkedIn (recommendations) or your Google Business Profile. Never create fake reviews.

## 10. After the site is live and verified
- Run a **Lighthouse** check on `/`, `/blog`, and one post, and re-run it after the og:image/icon work — note the SEO, Performance and Accessibility scores for comparison against these pre-deploy improvements.