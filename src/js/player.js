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
        // Health & i-frames
        this.maxHp = 100;
        this.hp = this.maxHp;
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

        this.state = moving ? 'walk' : 'idle';

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
            const animation = this.animations[this.state];
            this.frame = (this.frame + 1) % animation.frames;
        }
    }

    draw(ctx) {
        const animation = this.animations[this.state];
        const destW = this.size * 2;
        const destH = this.size * 2;
        // Blink visibility during invulnerability frames
        const isBlinking = (this.invuln && this.invuln > 0);
        const visible = !isBlinking || (Math.floor(this.invuln / 3) % 2 === 1);

        if (visible) {
        if (this.sprite && this.sprite.complete && (this.sprite.naturalWidth || 0) > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            if (this.faceDir === 1) ctx.scale(-1, 1); // flip for right-facing
            ctx.drawImage(
                this.sprite,
                this.frame * this.frameWidth,
                animation.row * this.frameHeight,
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
