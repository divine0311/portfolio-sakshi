import fs from 'fs';
const s = fs.readFileSync('C:/Users/HP/Desktop/portfolio-sakshi/scripts/prerender-blog.mjs','utf8');
const lines = s.split('\n');
console.log(lines.slice(400,560).join('\n'));
