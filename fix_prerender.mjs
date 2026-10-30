import fs from 'fs';
const file = 'C:/Users/HP/Desktop/portfolio-sakshi/scripts/prerender-blog.mjs';
let s = fs.readFileSync(file,'utf8');

// Fix sitemap to only include required URLs
const newSitemap = /* sitemap */
const SERVICE_PAGES = [
  {loc: \\/ai-developer\, priority: '0.7'},
  {loc: \\/digital-marketer\, priority: '0.7'},
];

const urls = [
  {loc: \\/\, priority: '1.0'},
  ...SERVICE_PAGES,
  ...posts.map((p) => ({loc: \\/blog/\\, lastmod: '2026-10-28', priority: '0.6'})),
];

/* Image sitemap — helps "Sakshi Gill" photos surface in Google image search */
const HOME_IMAGES = [
  {
    loc: \\/sakshi_portrait.webp\,
    title: 'Sakshi Gill — AI Developer and Digital Marketer',
    caption:
      'Portrait of Sakshi Gill, AI Developer, Digital Marketer and Photo-Video Editor from Kaithal, Haryana.',
  },
  {
    loc: \\/sakshi-gill-portrait.webp\,
    title: 'Sakshi Gill portrait',
    caption: 'Sakshi Gill — AI Developer and Digital Marketer from Kaithal, Haryana.',
  },
  {
    loc: \\/sakshi-gill-vision.webp\,
    title: 'Sakshi Gill — My Vision and Goals',
    caption: 'Sakshi Gill sharing her vision and goals as an AI developer and digital marketer.',
  },
  {
    loc: \\/sakshi-gill-journey.webp\,
    title: 'Sakshi Gill — My Journey',
    caption: 'Sakshi Gill on her journey mastering AI tools, storytelling and creative frameworks.',
  },
  {
    loc: \\/og-image-1200x630.jpg\,
    title: 'Sakshi Gill portfolio',
    caption:
      'Sakshi Gill — AI Developer, Digital Marketer and Photo-Video Editor. AI chatbots, websites, digital marketing and video editing.',
  },
];

const imageXml =
  '\\n' +
  HOME_IMAGES.map(
    (i) =>
      '    <image:image>\\n' +
      \      <image:loc>\</image:loc>\\n\ +
      \      <image:title>\</image:title>\\n\ +
      \      <image:caption>\</image:caption>\\n\ +
      '    </image:image>',
  ).join('\\n');

const sitemap =
  '<?xml version="1.0" encoding=\"UTF-8\"?>\\n' +
  '<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\\n' +
  urls
    .map(
      (u) =>
        \  <url>\\n    <loc>\</loc>\ +
        (u.lastmod ? \\\n    <lastmod>\</lastmod>\ : '') +
        (u.loc === \\/\ ? imageXml : '') +
        \\\n    <priority>\</priority>\\n  </url>\,
    )
    .join('\\n') +
  '\\n</urlset>\\n';;

const start = s.indexOf('/* sitemap */');
const end = s.indexOf('writeFileSync(join(dist, \'sitemap.xml\'), sitemap);');
if (start === -1 || end === -1) { console.log('ERR'); process.exit(1); }
const endIdx = s.indexOf('\n', end);
s = s.slice(0,start) + newSitemap + s.slice(endIdx);
fs.writeFileSync(file, s);
console.log('ok');
