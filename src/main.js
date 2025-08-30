import Player from './player.js';
import { updateProjectiles, drawProjectiles } from './projectile.js';
import { updateSpawner } from './spawner.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameState = window.gameState = {
    keys: {},
    player: null,
    enemies: [],
    projectiles: [],
    spawnTimer: 0,
    spawnInterval: 120,
    difficulty: 0
};

function updatePlayer() {
    gameState.player.update();
}

function drawPlayer() {
    gameState.player.draw(ctx);
}

function updateEnemies() {
    updateSpawner(gameState, canvas);
    gameState.enemies.forEach(enemy => enemy.update());
}

function drawEnemies() {
    gameState.enemies.forEach(enemy => enemy.draw(ctx));
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    clearCanvas();
    updatePlayer();
    updateEnemies();
    updateProjectiles(gameState, canvas);
    drawPlayer();
    drawEnemies();
    drawProjectiles(gameState, ctx);
    requestAnimationFrame(gameLoop);
}

function init() {
    gameState.player = new Player(canvas, gameState);
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
