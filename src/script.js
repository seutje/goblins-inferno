const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameState = window.gameState = {
    keys: {},
    player: null,
    projectiles: []
};

class Projectile {
    constructor(x, y, { damage = 1, speed = 5, size = 5, color = 'red', dx = 0, dy = -1 } = {}) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.size = size;
        this.color = color;
        this.dx = dx;
        this.dy = dy;
    }

    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function fireInfernoBlast(x, y) {
    gameState.projectiles.push(new Projectile(x, y - 10, { damage: 1, speed: 6, size: 5, color: 'red' }));
}

function fireFlameStream(x, y) {
    gameState.projectiles.push(new Projectile(x, y - 10, { damage: 0.5, speed: 8, size: 3, color: 'orange' }));
}

function fireVolatileOrb(x, y) {
    gameState.projectiles.push(new Projectile(x, y - 10, { damage: 3, speed: 2, size: 10, color: 'purple' }));
}

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speed = 3;
        this.size = 20;
        this.fireCooldown = 0;
        this.weapon = 'inferno';
    }

    update() {
        if (gameState.keys['KeyW']) this.y -= this.speed;
        if (gameState.keys['KeyS']) this.y += this.speed;
        if (gameState.keys['KeyA']) this.x -= this.speed;
        if (gameState.keys['KeyD']) this.x += this.speed;

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));

        if (this.fireCooldown <= 0) {
            if (this.weapon === 'inferno') {
                fireInfernoBlast(this.x, this.y - this.size);
                this.fireCooldown = 15;
            } else if (this.weapon === 'flame') {
                fireFlameStream(this.x, this.y - this.size);
                this.fireCooldown = 3;
            } else if (this.weapon === 'orb') {
                fireVolatileOrb(this.x, this.y - this.size);
                this.fireCooldown = 45;
            }
        } else {
            this.fireCooldown--;
        }
    }

    draw() {
        ctx.fillStyle = 'lime';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateProjectiles() {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const p = gameState.projectiles[i];
        p.update();
        if (p.y < -p.size || p.y > canvas.height + p.size || p.x < -p.size || p.x > canvas.width + p.size) {
            gameState.projectiles.splice(i, 1);
        }
    }
}

function drawProjectiles() {
    gameState.projectiles.forEach(p => p.draw());
}

function updatePlayer() {
    gameState.player.update();
}

function drawPlayer() {
    gameState.player.draw();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    clearCanvas();
    updatePlayer();
    updateProjectiles();
    drawPlayer();
    drawProjectiles();
    requestAnimationFrame(gameLoop);
}

function init() {
    gameState.player = new Player();
    window.addEventListener('keydown', e => {
        gameState.keys[e.code] = true;
        if (e.code === 'Digit1') gameState.player.weapon = 'inferno';
        if (e.code === 'Digit2') gameState.player.weapon = 'flame';
        if (e.code === 'Digit3') gameState.player.weapon = 'orb';
    });
    window.addEventListener('keyup', e => gameState.keys[e.code] = false);
    gameLoop();
}

init();
