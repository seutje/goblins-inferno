import { fireInfernoBlast, fireFlameStream, fireVolatileOrb } from './projectile.js';
import { versioned } from './assets.js';
import { spawnFirePatch } from './hazard.js';
import { playSound } from './audio.js';

export default class Player {
  constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        const W = (gameState?.world?.width) || canvas.width;
        const H = (gameState?.world?.height) || canvas.height;
        this.x = W / 2;
        this.y = H / 2;
        this.baseSpeed = 3;
        // Updated for much larger character sprites (170x170 frames)
        this.frameWidth = 175;
        this.frameHeight = 200;
        // Use a gameplay hit radius decoupled from visual frame size
        this.size = 24;
        // Health, shield & i-frames
        this.maxHp = 100;
        this.hp = this.maxHp;
        // Shield properties (enabled for certain characters like Fizzle)
        this.shieldMax = 0;
        this.shield = 0;
        this.shieldRegenRate = 0.12; // per frame
        this.shieldRegenCooldown = 0; // frames until regen resumes
        this.invuln = 0; // frames of invulnerability after taking damage
        this.fireCooldown = 0;
        this.weapon = 'inferno';

        this.stats = {
            speedMultiplier: 1,
            fireRateMultiplier: 1,
            damageMultiplier: 1,
            projSizeMultiplier: 1
        };

        this.sprite = new Image();
        this.sprite.src = versioned('src/img/sprite-goblin.png');
        this.animations = {
            idle: { row: 0, frames: 3 },
            walk: { row: 1, frames: 6 },
            attack: { row: 2, frames: 3 },
            hurt: { row: 3, frames: 1 },
            death: { row: 4, frames: 2 }
        };
        this.state = 'idle';
        this.faceDir = -1; // -1 = left (sprite default), 1 = right
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 10;
        this._stateLock = 0; // frames to keep current state (e.g., hurt/proc)
        this._dead = false;
        // Sprite orientation: by default our sheets face left; flip when moving right
        this.flipWhenRight = true;

        // Internal timers
        this._trailTimer = 0;
        this._flash = 0;
    }

    update() {
        const keys = this.gameState.keys;
        let moving = false;
        const speed = this.baseSpeed * this.stats.speedMultiplier;
        let moveX = 0;
        if (keys['KeyW']) { this.y -= speed; moving = true; }
        if (keys['KeyS']) { this.y += speed; moving = true; }
        if (keys['KeyA']) { this.x -= speed; moving = true; moveX -= 1; }
        if (keys['KeyD']) { this.x += speed; moving = true; moveX += 1; }

        if (moveX !== 0) this.faceDir = moveX > 0 ? 1 : -1;

        // Touch joystick movement (analog)
        const tv = this.gameState._touchMove;
        if (tv && (Math.abs(tv.dx) > 0.01 || Math.abs(tv.dy) > 0.01)) {
            this.x += tv.dx * speed;
            this.y += tv.dy * speed;
            moving = true;
            if (Math.abs(tv.dx) > 0.05) this.faceDir = tv.dx > 0 ? 1 : -1;
        }

        // Default state from input
        let desiredState = moving ? 'walk' : 'idle';
        // Potion proc visual (Fizzle): override temporarily
        if (this.gameState.character === 'Fizzle' && (this.gameState._fizzleProcTimer || 0) > 0) {
            desiredState = 'proc';
            this._stateLock = Math.max(this._stateLock, 6);
        }
        // If locked (hurt/proc), keep current state until timer ends
        if (this._stateLock > 0 && (this.state === 'hurt' || this.state === 'proc')) {
            this._stateLock--;
        } else {
            this.state = desiredState;
        }

        const W = (this.gameState?.world?.width) || this.canvas.width;
        const H = (this.gameState?.world?.height) || this.canvas.height;
        this.x = Math.max(this.size, Math.min(W - this.size, this.x));
        this.y = Math.max(this.size, Math.min(H - this.size, this.y));

        // Aim direction: towards mouse if available, otherwise up
        let aim = { dx: 0, dy: -1 };
        const m = this.gameState.mouse;
        if (m && typeof m.x === 'number' && typeof m.y === 'number') {
            const dx = m.x - this.x;
            const dy = m.y - this.y;
            const d = Math.hypot(dx, dy) || 1;
            aim = { dx: dx / d, dy: dy / d };
        }

        if (this.invuln > 0) this.invuln--;

        // Shield regeneration after a short delay
        if (this.shieldMax > 0) {
            if (this.shieldRegenCooldown > 0) this.shieldRegenCooldown--;
            else if (this.shield < this.shieldMax) {
                this.shield = Math.min(this.shieldMax, this.shield + (this.shieldRegenRate || 0));
            }
        }

        if (this.fireCooldown <= 0) {
            if (this.weapon === 'inferno') {
                this._fireWithMeta((dir)=>fireInfernoBlast(this.gameState, this.x, this.y, dir), aim, 6);
                this.fireCooldown = Math.max(1, Math.floor(15 / this.stats.fireRateMultiplier));
            } else if (this.weapon === 'flame') {
                this._fireWithMeta((dir)=>fireFlameStream(this.gameState, this.x, this.y, dir), aim, 4);
                this.fireCooldown = Math.max(1, Math.floor(3 / this.stats.fireRateMultiplier));
            } else if (this.weapon === 'orb') {
                this._fireWithMeta((dir)=>fireVolatileOrb(this.gameState, this.x, this.y, dir), aim, 10);
                this.fireCooldown = Math.max(1, Math.floor(45 / this.stats.fireRateMultiplier));
            }
        } else {
            this.fireCooldown--;
        }

        // Ignis trait: fire trail that leaves damaging patches periodically
        if (this.gameState.trait === 'fireTrail') {
            if (this._trailTimer <= 0) {
                spawnFirePatch(this.gameState, this.x, this.y, { radius: 16, duration: 90, dps: 0.4, faction: 'player' });
                // Spawn frequency scales with fire rate slightly
                const base = 18;
                const scale = Math.max(6, Math.floor(base / this.stats.fireRateMultiplier));
                this._trailTimer = scale;
            } else {
                this._trailTimer--;
            }
        }

        if (this._flash > 0) this._flash--;
        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            const animation = this.animations[this.state] || this.animations['idle'];
            const cols = this._sheetCols();
            const maxFrames = Math.max(1, Math.min(animation.frames || cols, cols));
            // For fixed frame animations (e.g. proc), don't advance
            if (animation.fixedFrame == null) {
                if (this.state === 'death' && this._dead) {
                    // Freeze on last frame when dead
                    this.frame = Math.min(this.frame + 1, maxFrames - 1);
                } else {
                    this.frame = (this.frame + 1) % maxFrames;
                }
            }
        }
    }

    draw(ctx) {
        const animation = this.animations[this.state] || this.animations['idle'];
        const destW = this.size * 2;
        const destH = this.size * 2;
        // Blink visibility during invulnerability frames
        const isBlinking = (this.invuln && this.invuln > 0);
        const visible = !isBlinking || (Math.floor(this.invuln / 3) % 2 === 1);

        if (visible) {
        if (this.sprite && this.sprite.complete && (this.sprite.naturalWidth || 0) > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Flip based on per-character default facing
            const shouldFlip = this.flipWhenRight ? (this.faceDir === 1) : (this.faceDir === -1);
            if (shouldFlip) ctx.scale(-1, 1);
            const cols = this._sheetCols();
            const maxFrames = Math.max(1, Math.min(animation.frames || cols, cols));
            const useFrame = (animation.fixedFrame != null)
                ? Math.max(0, Math.min(animation.fixedFrame, maxFrames - 1))
                : Math.max(0, Math.min(this.frame, maxFrames - 1));
            const si = this._sheetInfo();
            ctx.drawImage(
                this.sprite,
                si.offX + useFrame * this.frameWidth,
                si.offY + (animation.row || 0) * this.frameHeight,
                this.frameWidth,
                this.frameHeight,
                -destW / 2,
                -destH / 2,
                destW,
                destH
            );
            ctx.restore();
        } else {
                ctx.fillStyle = 'lime';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Damage flash overlay
        if ((this.invuln && this.invuln > 0) || (this._flash && this._flash > 0)) {
            ctx.save();
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = '#f33';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // HP bar above the player
        const barW = Math.max(24, destW);
        const barH = 6;
        const bx = this.x - barW / 2;
        const by = this.y - destH / 2 - 10;
        const frac = Math.max(0, Math.min(1, (this.hp || 0) / (this.maxHp || 1)));
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx, by, barW, barH);
        // Player HP bar in red to match theme
        ctx.fillStyle = '#e33';
        ctx.fillRect(bx, by, barW * frac, barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(bx, by, barW, barH);

        // Shield bar (blue), displayed above HP bar if shield is enabled
        if ((this.shieldMax || 0) > 0) {
            const sFrac = Math.max(0, Math.min(1, (this.shield || 0) / (this.shieldMax || 1)));
            const sy = by - (barH + 2);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(bx, sy, barW, barH);
            ctx.fillStyle = '#4aa3ff'; // blue shield color
            ctx.fillRect(bx, sy, barW * sFrac, barH);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(bx, sy, barW, barH);
        }
    }

    _fireWithMeta(shootFn, aim, baseSpreadDeg=6) {
        const msLevel = this.gameState._metaMods?.multishot || 0;
        const bounces = this.gameState._metaMods?.bounce || 0;
        const shotsPerSide = msLevel; // total shots = 1 + 2*level
        const rad = (deg)=>deg*Math.PI/180;
        const dirs = [];
        dirs.push(aim);
        for (let i = 1; i <= shotsPerSide; i++) {
            const a = baseSpreadDeg * i;
            dirs.push(rotate(aim, rad(a)));
            dirs.push(rotate(aim, rad(-a)));
        }
        // temporarily set a global bouncesLeft on gameState for projectile factory to pick up
        const prev = this.gameState._injectBounces;
        const prevP = this.gameState._injectPierce;
        this.gameState._injectBounces = bounces;
        this.gameState._injectPierce = (this.gameState._metaMods?.pierce || 0);
        // Play a single fire sound for the whole burst
        try { playSound('fire'); } catch {}
        dirs.forEach(d => shootFn(d));
        this.gameState._injectBounces = prev;
        this.gameState._injectPierce = prevP;
    }
}

function rotate(v, angleRad) {
    const ca = Math.cos(angleRad), sa = Math.sin(angleRad);
    return { dx: v.dx*ca - v.dy*sa, dy: v.dx*sa + v.dy*ca };
}

// Instance method definition appended after class using prototype to keep patch minimal
Player.prototype._sheetCols = function() {
    return this._sheetInfo().cols;
};

Player.prototype._sheetInfo = function() {
    const w = (this.sprite && (this.sprite.naturalWidth || 0)) || 0;
    const h = (this.sprite && (this.sprite.naturalHeight || 0)) || 0;
    const fw = Math.max(1, this.frameWidth || 1);
    const fh = Math.max(1, this.frameHeight || 1);
    const desiredCols = this.sheetCols || 0;
    const desiredRows = this.sheetRows || 0;
    const cols = Math.max(1, desiredCols || Math.floor(w / fw));
    const rows = Math.max(1, desiredRows || Math.floor(h / fh));
    let offX = Math.floor((w - cols * fw) / 2);
    let offY = Math.floor((h - rows * fh) / 2);
    if (offX < 0) offX = 0;
    if (offY < 0) offY = 0;
    return { cols, rows, offX, offY };
};
