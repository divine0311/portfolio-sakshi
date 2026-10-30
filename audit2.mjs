import fs from 'fs';
const urls = ['/ai-developer','/blog/ai-skills-on-top-my-toolkit','/blog/best-chatbot-creator-in-kaithal','/blog/best-communicator-in-kaithal','/blog/best-content-creator-in-kaithal','/blog/best-digital-marketer-in-kaithal','/blog/best-editor-in-kaithal','/blog/best-web-designer-in-kaithal','/blog/top-content-strategist-in-kaithal','/digital-marketer'];
for (let p of urls) {
  let path;
  if (p === '/ai-developer') path = 'C:/Users/HP/Desktop/portfolio-sakshi/dist/ai-developer.html';
  else if (p === '/digital-marketer') path = 'C:/Users/HP/Desktop/portfolio-sakshi/dist/digital-marketer.html';
  else {
    const slug = p.split('/blog/')[1];
    path = 'C:/Users/HP/Desktop/portfolio-sakshi/dist/blog/' + slug + '/index.html';
  }
  try {
    const s = fs.readFileSync(path, 'utf8');
    const t = s.match(/<title>(.*?)<\/title>/is);
    const c = s.match(/rel=[\"']canonical[\"'][^>]+href=[\"']([^\"']*)[\"']/is);
    const h = s.match(/<h1[^>]*>(.*?)<\/h1>/is);
    console.log(p + ' | ' + (t?t[1]:'') + ' | ' + (h?h[1].replace(/<[^>]+>/g,'').trim():'') + ' | ' + (c?c[1]:''));
  } catch(e) {
    console.log(p + ' | ERR');
  }
}
