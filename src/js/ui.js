import { getImage } from './preload.js';

// Draws a rounded rectangle path
function roundedPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Canvas-styled bar, matching the sprite art style
function drawBarStyled(ctx, kind, x, y, w, h, frac) {
  const radius = h * 0.4;
  const frameColor = '#4a2d1a';
  const innerBorder = 'rgba(0, 0, 0, 0.2)';

  // Background track
  const track = ctx.createLinearGradient(x, y, x, y + h);
  if (kind === 'shield') {
    track.addColorStop(0, '#1e3a59');
    track.addColorStop(1, '#10253f');
  } else { // health
    track.addColorStop(0, '#59231a');
    track.addColorStop(1, '#3f140e');
  }
  roundedPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = track;
  ctx.fill();

  // Filled portion
  const fw = Math.max(0, Math.floor(w * frac));
  if (fw > 0) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    if (kind === 'shield') {
      // Match boss arrow colors for player shield bar
      grad.addColorStop(0, '#50aaff');
      grad.addColorStop(1, '#002850');
    } else { // health
      grad.addColorStop(0, '#e84f39');
      grad.addColorStop(1, '#d73e28');
    }
    roundedPath(ctx, x, y, fw, h, radius);
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner highlight gloss
    const glossH = Math.max(1, Math.floor(h * 0.5));
    if (fw >= 3 && glossH > 0) {
      const glossGrad = ctx.createLinearGradient(0, y, 0, y + glossH);
      glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      const ghW = Math.max(1, fw - 2);
      roundedPath(ctx, x + 1, y + 1, ghW, glossH, Math.max(0, radius - 1));
      ctx.fillStyle = glossGrad;
      ctx.fill();
    }

    // Inner border
    if (fw >= 2) {
      roundedPath(ctx, x + 0.5, y + 0.5, fw - 1, h - 1, radius);
      ctx.strokeStyle = innerBorder;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Outer frame
  ctx.lineWidth = Math.max(2, h * 0.12);
  const inset = ctx.lineWidth / 2;
  roundedPath(ctx, x + inset, y + inset, w - ctx.lineWidth, h - ctx.lineWidth, Math.max(0, radius - inset));
  ctx.strokeStyle = frameColor;
  ctx.stroke();
}

export function drawBar(ctx, kind, x, y, w, h, frac) {
  // Always use canvas-styled drawing
  drawBarStyled(ctx, kind, x, y, w, h, frac);
}
