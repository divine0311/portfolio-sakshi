/**
 * One-off image optimiser (run manually, not part of `npm run build`).
 *
 * Produces the assets the SEO tags point at:
 *   public/og-image-1200x630.jpg   social preview card (1.91:1 crop of the hero portrait)
 *   public/sakshi-gill-portrait.webp
 *   public/sakshi-gill-journey.webp
 *   public/sakshi-gill-vision.webp
 *
 * The three photos are 3024x4032 phone shots of 2-2.5 MB each. They are shown
 * inside fixed-size frames, so a 1400px WebP at quality 82 looks identical and
 * is roughly 10x smaller.
 *
 * Usage: node scripts/make-images.mjs
 */
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

/* Social card: centre crop of the hero portrait, resized to 1200x630. */
await sharp(join(pub, 'sakshi_portrait.jpg'))
  .resize(1200, 630, {fit: 'cover', position: 'attention'})
  .jpeg({quality: 82, mozjpeg: true})
  .toFile(join(pub, 'og-image-1200x630.jpg'));
console.log('  public/og-image-1200x630.jpg');

/* Page photos -> WebP at a size larger than any displayed frame. */
for (const name of ['sakshi_portrait', 'sakshi-gill-portrait', 'sakshi-gill-journey', 'sakshi-gill-vision']) {
  await sharp(join(pub, `${name}.jpg`))
    .resize({width: 1400, withoutEnlargement: true})
    .webp({quality: 82})
    .toFile(join(pub, `${name}.webp`));
  console.log(`  public/${name}.webp`);
}

/* Tiny hero video poster: re-save so it is not a 240x135 JPEG stretched full-screen. */
const poster = await sharp(join(pub, 'sakshi-video-poster.jpg')).metadata();
console.log(`  poster source: ${poster.width}x${poster.height}`);

/* Report sizes so the saving is visible. */
for (const name of [
  'og-image-1200x630.jpg',
  'sakshi_portrait.webp',
  'sakshi-gill-portrait.webp',
  'sakshi-gill-journey.webp',
  'sakshi-gill-vision.webp',
]) {
  const {size} = await import('node:fs').then((fs) => fs.promises.stat(join(pub, name)));
  const meta = await sharp(join(pub, name)).metadata();
  console.log(`  ${name}: ${meta.width}x${meta.height}, ${(size / 1024).toFixed(0)} KB`);
}
