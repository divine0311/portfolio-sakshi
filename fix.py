path='C:/Users/HP/Desktop/portfolio-sakshi/scripts/prerender-blog.mjs'
s=open(path).read()
old='/* sitemap */\nconst SERVICE_PAGES = [\n  {loc: ${siteUrl}/ai-developer, priority: '0.7'},\n  {loc: ${siteUrl}/digital-marketer, priority: '0.7'},\n  {loc: ${siteUrl}/editor, priority: '0.7'},\n];\n\nconst urls = [\n  {loc: ${siteUrl}/, priority: '1.0'},\n  {loc: ${siteUrl}/blog, priority: '0.8'},\n  ...SERVICE_PAGES,\n  ...posts.map((p) => ({loc: ${siteUrl}/blog/, lastmod: p.date, priority: '0.6'})),\n];'
new='/* sitemap */\nconst SERVICE_PAGES = [\n  {loc: ${siteUrl}/ai-developer, priority: '0.7'},\n  {loc: ${siteUrl}/digital-marketer, priority: '0.7'},\n];\n\nconst urls = [\n  {loc: ${siteUrl}/, priority: '1.0'},\n  ...SERVICE_PAGES,\n  ...posts.map((p) => ({loc: ${siteUrl}/blog/, lastmod: '2026-10-28', priority: '0.6'})),\n];'
if old not in s:
    print('no')
else:
    open(path,'w').write(s.replace(old,new))
    print('ok')
