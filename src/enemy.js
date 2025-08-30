export class Enemy {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speed = 1;
        // Basic combat properties
        this.hp = 10;
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.size = this.frameWidth / 2;
        this.sprite = new Image();
        this.animations = {
            idle: { row: 0, frames: 2 },
            walk: { row: 1, frames: 4 },
            attack: { row: 2, frames: 2 },
            death: { row: 3, frames: 2 }
        };
        this.state = 'walk';
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 15;
    }

    advanceFrame() {
        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            const animation = this.animations[this.state];
            this.frame = (this.frame + 1) % animation.frames;
        }
    }

    update() {
        const player = this.gameState.player;
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
                this.state = 'walk';
            } else {
                this.state = 'idle';
            }
        }
        this.advanceFrame();
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
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export class DebtSkeleton extends Enemy {
    constructor(canvas, gameState) {
        super(canvas, gameState);
        this.speed = 1;
        this.hp = 10;
        this.sprite.src = 'img/sprite-skeleton.png';
    }
}

export class LoanerImp extends Enemy {
    constructor(canvas, gameState) {
        super(canvas, gameState);
        this.speed = 2;
        this.hp = 20;
        this.sprite.src = 'img/sprite-imp.png';
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        super.update();
        this.x += Math.sin(this.angle) * 2;
        this.angle += 0.1;
    }
}

export class BailiffOgre extends Enemy {
    constructor(canvas, gameState) {
        super(canvas, gameState);
        this.speed = 0.75;
        this.hp = 150;
        this.sprite.src = 'img/sprite-ogre.png';
        this.chargeCooldown = 0;
    }

    update() {
        const player = this.gameState.player;
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 80 && this.chargeCooldown <= 0) {
                this.x += (dx / dist) * this.speed * 4;
                this.y += (dy / dist) * this.speed * 4;
                this.state = 'attack';
                this.chargeCooldown = 60;
            } else if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
                this.state = 'walk';
            } else {
                this.state = 'idle';
            }
        }
        if (this.chargeCooldown > 0) this.chargeCooldown--;
        this.advanceFrame();
    }
}
