import Player from './player.js';
import { updateProjectiles, drawProjectiles } from './projectile.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameState = window.gameState = {
    keys: {},
    player: null,
    projectiles: []
};

function updatePlayer() {
    gameState.player.update();
}

function drawPlayer() {
    gameState.player.draw(ctx);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    clearCanvas();
    updatePlayer();
    updateProjectiles(gameState, canvas);
    drawPlayer();
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
