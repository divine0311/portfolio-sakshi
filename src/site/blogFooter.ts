/**
 * Footer + 3D location card, shared by the listing and post views.
 * Filters in the category column drive the listing view.
 */
import {LINKS, categoryStyle} from './blogSeed';

function face(): string {
  const faces = Array.from({length: 6}, () => '<i>KT</i>').join('');
  return (
    `<div class="card loc" style="${categoryStyle('Digital Marketing')};--i:0" role="img" aria-label="Based in Kaithal, Haryana">` +
    '<div class="face"><div class="bg"></div>' +
    '<span class="tag">Based in Kaithal, Haryana</span>' +
    `<div class="cube">${faces}</div>` +
    '<span class="orb2"></span>' +
    '<div class="panel">' +
    '<h3>Kaithal, Haryana</h3>' +
    '<div class="meta">Available for digital marketing, content and AI projects across India.</div>' +
    '</div></div></div>'
  );
}

export function renderFooter(): void {
  const el = document.getElementById('site-footer') as HTMLElement | null;
  if (!el) return;

  el.innerHTML =
    '<div class="ft">' +
    '<div class="ft-brand">' +
    '<a class="brand" href="/#home">Sakshi Gill</a>' +
    '<p>Digital marketer, content creator and AI specialist helping local businesses get found online and grow with AI-powered content.</p>' +
    '</div>' +
    '<div>' +
    '<h4>Explore</h4>' +
    '<a href="/#home">Home</a>' +
    '<a href="/#capabilities">Services</a>' +
    '<a href="/blog">Blog</a>' +
    '</div>' +
    '<div>' +
    '<h4>Categories</h4>' +
    '<button data-fc="All" type="button">All articles</button>' +
    '<button data-fc="Digital Marketing" type="button">Digital Marketing</button>' +
    '<button data-fc="AI Tools" type="button">AI Tools</button>' +
    '<button data-fc="Editing" type="button">Editing</button>' +
    '</div>' +
    '<div class="ft-card">' +
    face() +
    '<a class="btn" style="margin-top:18px;display:inline-block;text-decoration:none" href="' +
    LINKS.contact +
    '">Contact me</a>' +
    '</div>' +
    '</div>' +
    `<div class="ft-bar">© ${new Date().getFullYear()} Sakshi Gill. Built and maintained in Kaithal.</div>`;
}