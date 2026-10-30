import fs from 'fs';
const s = fs.readFileSync('C:/Users/HP/Desktop/portfolio-sakshi/dist/ai-developer.html','utf8');
const imgs = [...s.matchAll(/<img[^>]+>/gi)];
for (let m of imgs) { console.log(m[0]); }
