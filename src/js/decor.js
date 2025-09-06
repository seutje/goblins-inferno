import { versioned } from './assets.js';
import { getImage } from './preload.js';

const ROCK_PATHS = [
  'src/img/rock1.png',
  'src/img/rock2.png',
  'src/img/rock3.png',
  'src/img/rock4.png',
  'src/img/rock5.png',
  'src/img/rock6.png',
  'src/img/rock7.png',
];

export function initDecor(gameState, canvas) {
  // Prepare images and scatter copies across the whole world area
  const W = (gameState.world?.width) || canvas.width;
  const H = (gameState.world?.height) || canvas.height;
  const margin = 24; // keep slightly inside the world
  const spawnClear = 220; // clear circle around world center
  const minDist = 80; // minimum spacing between decor items
  const placements = [];
  const imgs = ROCK_PATHS.map(p => getImage(p));

  // number of rocks proportional to world area (clamped)
  const area = W * H;
  // Reduce density by half
  const baseCount = Math.floor(area * 0.000025); // previously ~0.00005 per pixel
  const count = Math.max(32, Math.min(120, baseCount));

  // rejection sampling to maintain spacing
  let attempts = 0; const maxAttempts = count * 15;
  while (placements.length < count && attempts < maxAttempts) {
    attempts++;
    const img = imgs[Math.floor(Math.random() * imgs.length)];
    const scale = 0.7 + Math.random() * 0.9; // 0.7x..1.6x (actual rendering is further scaled down)
    const flip = Math.random() < 0.5 ? -1 : 1;
    const x = margin + Math.random() * (W - margin * 2);
    const y = margin + Math.random() * (H - margin * 2);
    // avoid crowding spawn center
    const cx = W / 2, cy = H / 2;
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < spawnClear * spawnClear) continue;
    // spacing check
    let ok = true;
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      const dx = p.x - x, dy = p.y - y;
      if (dx * dx + dy * dy < minDist * minDist) { ok = false; break; }
    }
    if (!ok) continue;
    placements.push({ img, x, y, scale, flip });
  }
  gameState.decor = placements;
}

export function drawDecor(gameState, ctx) {
  const items = gameState.decor || [];
  for (const d of items) {
    const img = d.img;
    if (!img || !img.complete || !(img.naturalWidth > 0)) continue;
    // Reduce overall decor size by 3x while preserving per-item random scaling
    const sizeScale = (1/3);
    const s = d.scale * sizeScale;
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(d.flip, 1);
    // draw centered-bottom to sit on ground naturally
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
  }
}
