import fs from 'fs';
const file = 'C:/Users/HP/Desktop/portfolio-sakshi/scripts/prerender-blog.mjs';
let s = fs.readFileSync(file,'utf8');
const old = /* sitemap */
const SERVICE_PAGES = [
  {loc: \\/ai-developer\, priority: '0.7'},
  {loc: \\/digital-marketer\, priority: '0.7'},
  {loc: \\/editor\, priority: '0.7'},
];

const urls = [
  {loc: \\/\, priority: '1.0'},
  {loc: \\/blog\, priority: '0.8'},
  ...SERVICE_PAGES,
  ...posts.map((p) => ({loc: \\/blog/\\, lastmod: p.date, priority: '0.6'})),
];;
const neu = /* sitemap */
const SERVICE_PAGES = [
  {loc: \\/ai-developer\, priority: '0.7'},
  {loc: \\/digital-marketer\, priority: '0.7'},
];

const urls = [
  {loc: \\/\, priority: '1.0'},
  ...SERVICE_PAGES,
  ...posts.map((p) => ({loc: \\/blog/\\, lastmod: '2026-10-28', priority: '0.6'})),
];;
if (!s.includes(old)) { console.log('not found'); process.exit(1); }
s = s.replace(old, neu);
fs.writeFileSync(file, s);
console.log('ok');
