import { fireInfernoBlast, fireFlameStream, fireVolatileOrb } from './projectile.js';
import { versioned } from './assets.js';
import { spawnFirePatch } from './hazard.js';

export default class Player {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
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
        if (keys['KeyW']) { this.y -= speed; moving = true; }
        if (keys['KeyS']) { this.y += speed; moving = true; }
        if (keys['KeyA']) { this.x -= speed; moving = true; }
        if (keys['KeyD']) { this.x += speed; moving = true; }

        this.state = moving ? 'walk' : 'idle';

        this.x = Math.max(this.size, Math.min(this.canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(this.canvas.height - this.size, this.y));

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
                fireInfernoBlast(this.gameState, this.x, this.y, aim);
                this.fireCooldown = Math.max(1, Math.floor(15 / this.stats.fireRateMultiplier));
            } else if (this.weapon === 'flame') {
                fireFlameStream(this.gameState, this.x, this.y, aim);
                this.fireCooldown = Math.max(1, Math.floor(3 / this.stats.fireRateMultiplier));
            } else if (this.weapon === 'orb') {
                fireVolatileOrb(this.gameState, this.x, this.y, aim);
                this.fireCooldown = Math.max(1, Math.floor(45 / this.stats.fireRateMultiplier));
            }
        } else {
            this.fireCooldown--;
        }

        // Ignis trait: fire trail that leaves damaging patches periodically
        if (this.gameState.trait === 'fireTrail') {
            if (this._trailTimer <= 0) {
                spawnFirePatch(this.gameState, this.x, this.y, { radius: 16, duration: 90, dps: 0.4 });
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
                ctx.drawImage(
                    this.sprite,
                    this.frame * this.frameWidth,
                    animation.row * this.frameHeight,
                    this.frameWidth,
                    this.frameHeight,
                    this.x - destW / 2,
                    this.y - destH / 2,
                    destW,
                    destH
                );
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
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(bx, by, barW * frac, barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(bx, by, barW, barH);
    }
}
