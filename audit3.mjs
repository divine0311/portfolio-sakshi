import fs from 'fs';
console.log('=== ROUTES CHECK ===');
const items = [
  ['/ai-developer','C:/Users/HP/Desktop/portfolio-sakshi/dist/ai-developer.html','C:/Users/HP/Desktop/portfolio-sakshi/ai-developer.html'],
  ['/digital-marketer','C:/Users/HP/Desktop/portfolio-sakshi/dist/digital-marketer.html','C:/Users/HP/Desktop/portfolio-sakshi/digital-marketer.html']
];
for (let it of items) {
  for (let p of [it[1],it[2]]) {
    try {
      const s = fs.readFileSync(p,'utf8');
      console.log(it[0], p.includes('dist')?'DIST':'SRC', 'h1:'+(/<h1/i.test(s)), 'title:'+(/<title>/i.test(s)), 'desc:'+( /meta.*description/i.test(s) ), 'canon:'+( /rel=["']canonical["']/i.test(s) ));
    } catch(e) { console.log('ERR',p); }
  }
}
