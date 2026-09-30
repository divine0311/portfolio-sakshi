/**
 * Cursor-tracking character for the hero section.
 *
 * The source MP4 has a single keyframe, so any runtime `video.currentTime`
 * seeking stalls the page and `play()` leaves an uncontrolled clip running in
 * the background. Instead the rotation is pre-rendered to still WebP frames
 * (public/frames) and we only ever swap which one is painted. No decoder, no
 * seeking, no ghosting.
 *
 * Rules that keep it rock solid:
 *   1. exactly ONE frame is painted per rAF tick, fully opaque - alpha
 *      blending two frames would render a double face
 *   2. no CSS transform is ever applied to the canvas, the page or the
 *      character - only the painted pixels change
 *   3. the head follows a shortest-path angular lerp so it never spins the
 *      long way round when the cursor crosses the 0/360 seam
 */
const FRAME_COUNT = 64;
const FRAME_BASE = '/frames/';
const HERO_RED = '#A31712';

/** Shortest-path interpolation between two angles in degrees. */
function lerpAngle(from: number, to: number, t: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return from + delta * t;
}

function frameSrc(i: number): string {
  return `${FRAME_BASE}frame_${String(i).padStart(3, '0')}.webp`;
}

export function mountTrackingCharacter(): void {
  const canvas = document.getElementById('hero-tracking') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const images: HTMLImageElement[] = [];
  let ready = 0;
  // The canvas starts transparent so the poster shows until frames land,
  // mirroring how the <video> used to fade in.
  const reveal = () => {
    if (ready > 0) canvas.classList.add('is-ready');
  };
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const img = new Image();
    img.decoding = 'async';
    img.src = frameSrc(i);
    img.onload = () => {
      ready += 1;
      reveal();
    };
    images.push(img);
  }
  // Neutral pose used for the eye-contact dead zone.
  const center = new Image();
  center.decoding = 'async';
  center.src = `${FRAME_BASE}center.webp`;

  let target = 0;
  let current = 0;
  let raf = 0;
  let alive = true;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  };
  resize();
  window.addEventListener('resize', resize);

  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    // The face sits in the upper part of the frame, so the pivot follows it.
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.34;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const dead = Math.min(window.innerWidth, window.innerHeight) * 0.12;
    target = Math.hypot(dx, dy) < dead ? 0 : angle;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const draw = () => {
    if (!alive) return;
    raf = requestAnimationFrame(draw);

    const source = images[ready] || images[0];
    if (!source || !source.complete || source.naturalWidth === 0) return;

    current = lerpAngle(current, target, 0.26);
    const norm = ((current % 360) + 360) % 360;
    const index = Math.round((norm / 360) * FRAME_COUNT) % FRAME_COUNT;
    const img = images[index] || source;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.fillStyle = HERO_RED;
    ctx.fillRect(0, 0, cw, ch);

    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    // Single opaque draw - never blend.
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };
  raf = requestAnimationFrame(draw);

  window.addEventListener('pagehide', () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
  });
}
