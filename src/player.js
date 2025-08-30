import { fireInfernoBlast, fireFlameStream, fireVolatileOrb } from './projectile.js';

export default class Player {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.baseSpeed = 3;
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.size = this.frameWidth / 2;
        this.fireCooldown = 0;
        this.weapon = 'inferno';

        this.stats = {
            speedMultiplier: 1,
            fireRateMultiplier: 1,
            damageMultiplier: 1,
            projSizeMultiplier: 1
        };

        this.sprite = new Image();
        this.sprite.src = 'img/sprite-goblin.png';
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

        if (this.fireCooldown <= 0) {
            if (this.weapon === 'inferno') {
                fireInfernoBlast(this.gameState, this.x, this.y - this.size);
                this.fireCooldown = Math.max(1, Math.floor(15 / this.stats.fireRateMultiplier));
            } else if (this.weapon === 'flame') {
                fireFlameStream(this.gameState, this.x, this.y - this.size);
                this.fireCooldown = Math.max(1, Math.floor(3 / this.stats.fireRateMultiplier));
            } else if (this.weapon === 'orb') {
                fireVolatileOrb(this.gameState, this.x, this.y - this.size);
                this.fireCooldown = Math.max(1, Math.floor(45 / this.stats.fireRateMultiplier));
            }
        } else {
            this.fireCooldown--;
        }

        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            const animation = this.animations[this.state];
            this.frame = (this.frame + 1) % animation.frames;
        }
    }

    draw(ctx) {
        const animation = this.animations[this.state];
        if (this.sprite.complete) {
            ctx.drawImage(
                this.sprite,
                this.frame * this.frameWidth,
                animation.row * this.frameHeight,
                this.frameWidth,
                this.frameHeight,
                this.x - this.frameWidth / 2,
                this.y - this.frameHeight / 2,
                this.frameWidth,
                this.frameHeight
            );
        } else {
            ctx.fillStyle = 'lime';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
