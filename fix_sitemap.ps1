$file = "C:\Users\HP\Desktop\portfolio-sakshi\scripts\prerender-blog.mjs"
$s = Get-Content $file -Raw
$old = "/* sitemap */\r\nconst SERVICE_PAGES = [\r\n  {loc: `${siteUrl}/ai-developer`, priority: '0.7'},\r\n  {loc: `${siteUrl}/digital-marketer`, priority: '0.7'},\r\n  {loc: `${siteUrl}/editor`, priority: '0.7'},\r\n];\r\n\r\nconst urls = [\r\n  {loc: `${siteUrl}/`, priority: '1.0'},\r\n  {loc: `${siteUrl}/blog`, priority: '0.8'},\r\n  ...SERVICE_PAGES,\r\n  ...posts.map((p) => ({loc: `${siteUrl}/blog/${p.slug}`, lastmod: p.date, priority: '0.6'})),\r\n];"
$new = "/* sitemap */\r\nconst SERVICE_PAGES = [\r\n  {loc: `${siteUrl}/ai-developer`, priority: '0.7'},\r\n  {loc: `${siteUrl}/digital-marketer`, priority: '0.7'},\r\n];\r\n\r\nconst urls = [\r\n  {loc: `${siteUrl}/`, priority: '1.0'},\r\n  ...SERVICE_PAGES,\r\n  ...posts.map((p) => ({loc: `${siteUrl}/blog/${p.slug}`, lastmod: '2026-10-28', priority: '0.6'})),\r\n];"
if ($s.Contains($old)) {
  $s2 = $s.Replace($old, $new)
  Set-Content $file $s2 -Encoding UTF8
  Write-Host "ok"
} else {
  Write-Host "no"
}
