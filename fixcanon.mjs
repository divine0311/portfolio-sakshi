import fs from 'fs';
const files = ['C:/Users/HP/Desktop/portfolio-sakshi/ai-developer.html','C:/Users/HP/Desktop/portfolio-sakshi/digital-marketer.html'];
for (let f of files) {
  let s = fs.readFileSync(f,'utf8');
  s = s.replace(/https:\/\/sakshigill\.com/g, 'https://portfolio-sakshi-swart.vercel.app');
  fs.writeFileSync(f,s);
}
