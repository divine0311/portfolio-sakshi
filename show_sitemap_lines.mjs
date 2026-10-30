import fs from 'fs';
const s = fs.readFileSync('C:/Users/HP/Desktop/portfolio-sakshi/scripts/prerender-blog.mjs','utf8');
const lines = s.split('\n');
for (let i=0;i<lines.length;i++) {
  if (lines[i].includes('sitemap')) console.log((i+1)+':'+lines[i]);
}
