import Player from './player.js';
import { updateProjectiles, drawProjectiles } from './projectile.js';
import { updateSpawner } from './spawner.js';
import { initLevelSystem, updateLevelSystem, drawGems } from './level.js';
import { createDebtState, updateDebt, initDebtUI } from './debt.js';
import { applyCharacterToPlayer } from './characters.js';
import { updateHazards, drawHazards } from './hazard.js';
import { updateBoss, drawBossHUD } from './boss.js';
import { initAudio, playSound, setMuted } from './audio.js';
import { preloadAll } from './preload.js';
import { repay } from './debt.js';
import { initMeta, applyMetaAtRunStart } from './meta.js';
import { updatePickups, drawPickups, spawnHealthPickup } from './pickups.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    // Fill viewport
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        // Update world dimensions proportionally (4x area => 2x each dimension)
        if (gameState.world) {
            gameState.world.width = canvas.width * 2;
            gameState.world.height = canvas.height * 2;
            // Clamp camera to new bounds
            updateCamera();
        }
    }
}

const gameState = window.gameState = {
    keys: {},
    mouse: null,
    player: null,
    enemies: [],
    projectiles: [],
    spawnTimer: 0,
    spawnInterval: 120,
    difficulty: 0,
    balance: {
        spawnIntervalBase: 120,
        spawnIntervalMin: 30,
        gemTimerBase: 180,
        gemTimerMin: 90,
        bossThresholds: [30, 80, 140]
    },
    // Level & upgrade system
    xp: 0,
    level: 1,
    nextLevelXp: 5,
    gems: [],
    totalGems: 0,
    paused: false,
    upgradePool: [],
    upgradeChoices: [],
    onChooseUpgrade: null,
    // Debt & character
    debt: null,
    _refreshDebtHUD: null,
    character: null,
    trait: null,
    _buffs: [],
    hazards: [],
    // World and camera
    world: { width: canvas.width * 2, height: canvas.height * 2 }, // 4x area
    camera: { x: canvas.width / 2, y: canvas.height / 2 }
};

function updatePlayer() {
    if (gameState.player) gameState.player.update();
}

function drawPlayer() {
    if (gameState.player) gameState.player.draw(ctx);
}

function updateEnemies() {
    if (!gameState.player) return;
    updateSpawner(gameState, canvas);
    gameState.enemies.forEach(enemy => enemy.update());
}

function drawEnemies() {
    gameState.enemies.forEach(enemy => enemy.draw(ctx));
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateCamera() {
    const p = gameState.player;
    if (!p) return;
    // Keep player centered, but clamp to world bounds so we don't show outside
    const halfW = canvas.width / 2;
    const halfH = canvas.height / 2;
    const W = gameState.world.width;
    const H = gameState.world.height;
    const x = Math.max(halfW, Math.min(W - halfW, p.x));
    const y = Math.max(halfH, Math.min(H - halfH, p.y));
    gameState.camera.x = x;
    gameState.camera.y = y;
}

function damagePlayer(amount) {
    if (!gameState.player) return;
    const p = gameState.player;
    if (p.invuln && p.invuln > 0) return;
    p.hp = Math.max(0, p.hp - amount);
    p.invuln = 60;
    p._flash = 10;
    if (p.hp <= 0) onPlayerDeath();
}

function onPlayerDeath() {
    gameState.paused = true;
    gameState.gameOver = true;
    // End-of-run repayment: apply all gold to debt
    try { repay(gameState.debt, gameState.debt.gold || 0); } catch {}
    const modal = document.getElementById('gameOverModal');
    const statsEl = document.getElementById('gameOverStats');
    if (statsEl) statsEl.textContent = `Level ${gameState.level} | Gems ${gameState.totalGems}`;
    if (modal) modal.style.display = 'flex';
}

function restartRun() {
    // Clear dynamic state but preserve meta and debt
    gameState.paused = false;
    gameState.gameOver = false;
    gameState.player = null;
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.hazards = [];
    gameState.gems = [];
    gameState.pickups = [];
    gameState._buffs = [];
    gameState._injectBounces = undefined;
    gameState.spawnTimer = 0;
    gameState.difficulty = 0;
    gameState.xp = 0;
    gameState.level = 1;
    gameState.nextLevelXp = 5;
    gameState.totalGems = 0;
    gameState.character = null;
    gameState.trait = null;
    gameState.upgradeChoices = [];
    // Reset boss state
    gameState.boss = null;
    gameState._bossInit = false;
    gameState._bossIndex = 0;
    // Clear input
    gameState.keys = {};
    gameState.mouse = null;
    // Hide game over modal, show character selection
    const over = document.getElementById('gameOverModal');
    if (over) over.style.display = 'none';
    const charModal = document.getElementById('charModal');
    if (charModal) charModal.style.display = 'flex';
    if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD();
}

function checkCollisions() {
    // Circle (projectile) vs axis-aligned rectangle (enemy sprite bounds)
    for (let pi = gameState.projectiles.length - 1; pi >= 0; pi--) {
        const p = gameState.projectiles[pi];
        for (let ei = gameState.enemies.length - 1; ei >= 0; ei--) {
            const e = gameState.enemies[ei];
            const halfW = (e.size != null ? e.size : (e.frameWidth || 0) / 2);
            const halfH = (e.size != null ? e.size : (e.frameHeight || 0) / 2);
            const left = e.x - halfW;
            const right = e.x + halfW;
            const top = e.y - halfH;
            const bottom = e.y + halfH;

            const nearestX = Math.max(left, Math.min(p.x, right));
            const nearestY = Math.max(top, Math.min(p.y, bottom));
            const dx = p.x - nearestX;
            const dy = p.y - nearestY;
            const r = (p.size || 0);

            if (dx * dx + dy * dy <= r * r && p.faction === 'player') {
                // Hit registered
                let dmg = (p.damage || 0);
                // Gnorp trait: extra damage when enemy is close to player
                if (gameState.character === 'Gnorp' && gameState.player) {
                    const pdx = gameState.player.x - e.x;
                    const pdy = gameState.player.y - e.y;
                    const pd = Math.hypot(pdx, pdy);
                    if (pd < 80) dmg *= 1.25;
                }
                // Optional specialized boss/enemy hit handling
                if (typeof e.takeHit === 'function') {
                    // Temporarily override projectile damage if needed
                    const originalDamage = p.damage;
                    p.damage = dmg;
                    e.takeHit(p, gameState);
                    p.damage = originalDamage;
                } else if (typeof e.hp === 'number') {
                    e.hp -= dmg;
                }
                // Remove projectile on hit unless it has penetration left
                if (p.pierceLeft && p.pierceLeft > 0) {
                    p.pierceLeft--;
                } else {
                    gameState.projectiles.splice(pi, 1);
                }
                // Remove enemy if dead (non-boss auto removal; boss cleanup is in updateBoss)
                if (!e.isBoss && e.hp !== undefined && e.hp <= 0) {
                    playSound('enemy_die');
                    if (Math.random() < 0.10) {
                        spawnHealthPickup(gameState, e.x, e.y, { heal: 25 });
                    }
                    gameState.enemies.splice(ei, 1);
                }
                break; // Proceed to next projectile
            }
        }
    }
}

function checkPlayerDamage() {
    const p = gameState.player;
    if (!p) return;
    // Enemy projectile vs player circle
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        if (proj.faction !== 'enemy') continue;
        const dx = proj.x - p.x;
        const dy = proj.y - p.y;
        const rr = (proj.size || 0) + (p.size || 0);
        if (dx * dx + dy * dy <= rr * rr) {
            damagePlayer(proj.damage || 1);
            gameState.projectiles.splice(i, 1);
        }
    }
    // Enemy rect vs player circle (contact)
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.isBoss) continue; // optional: bosses damage via their projectiles/attacks
        const halfW = (e.size != null ? e.size : (e.frameWidth || 0) / 2);
        const halfH = (e.size != null ? e.size : (e.frameHeight || 0) / 2);
        const left = e.x - halfW;
        const right = e.x + halfW;
        const top = e.y - halfH;
        const bottom = e.y + halfH;
        const nearestX = Math.max(left, Math.min(p.x, right));
        const nearestY = Math.max(top, Math.min(p.y, bottom));
        const dx = p.x - nearestX;
        const dy = p.y - nearestY;
        if (dx * dx + dy * dy <= (p.size * p.size)) {
            damagePlayer(e.contactDamage || 5);
        }
    }
}

function gameLoop() {
    clearCanvas();

    if (!gameState.paused) {
        // FPS calc (smoothed)
        const now = performance.now();
        if (!gameState._lastTs) gameState._lastTs = now;
        const dt = now - gameState._lastTs;
        gameState._lastTs = now;
        const fps = 1000 / Math.max(1, dt);
        gameState._fps = Math.round((gameState._fps || fps) * 0.9 + fps * 0.1);
        // expire temporary buffs
        if (gameState._buffs && gameState._buffs.length) {
            for (let i = gameState._buffs.length - 1; i >= 0; i--) {
                const b = gameState._buffs[i];
                b.remaining--;
                if (b.remaining <= 0) {
                    if (typeof b.undo === 'function') b.undo();
                    gameState._buffs.splice(i, 1);
                }
            }
        }
        updatePlayer();
        updateBoss(gameState, canvas);
        updateEnemies();
        updateProjectiles(gameState, canvas);
        updateHazards(gameState);
        updatePickups(gameState);
        checkCollisions();
        checkPlayerDamage();
        if (gameState.player) updateLevelSystem(gameState, canvas);
        if (gameState.debt) updateDebt(gameState.debt);
        updateCamera();
    }

    // Apply camera transform for world-space rendering
    ctx.save();
    const camX = Math.round(gameState.camera.x - canvas.width / 2);
    const camY = Math.round(gameState.camera.y - canvas.height / 2);
    ctx.translate(-camX, -camY);
    // Ground effects first so trails render behind characters
    drawHazards(gameState, ctx);
    drawGems(gameState, ctx);
    drawPickups(gameState, ctx);
    // Entities and projectiles above ground
    drawPlayer();
    drawEnemies();
    drawProjectiles(gameState, ctx);
    ctx.restore();
    // Boss HUD and other UI draw in screen space
    drawBossHUD(gameState, ctx, canvas);
    // HUD dynamic info
    const fpsEl = document.getElementById('hud-fps');
    if (fpsEl && gameState._fps) fpsEl.textContent = String(gameState._fps);
    if (typeof gameState._refreshDebtHUD === 'function' && !gameState.paused) gameState._refreshDebtHUD();
    requestAnimationFrame(gameLoop);
}

function init() {
    resizeCanvas();
    initAudio();
    initMeta(gameState);
    // Initialize debt & HUD
    gameState.debt = createDebtState({ initialDebt: 10000, autoRepayPerFrame: 0.1 });
    initDebtUI(gameState);
    // Ensure world size scales with current canvas
    gameState.world = { width: canvas.width * 2, height: canvas.height * 2 };
    gameState.camera = { x: gameState.world.width / 2, y: gameState.world.height / 2 };
    // Character selection
    const charModal = document.getElementById('charModal');
    const btnGnorp = document.getElementById('pickGnorp');
    const btnIgnis = document.getElementById('pickIgnis');
    const btnFizzle = document.getElementById('pickFizzle');

    function startAs(characterKey) {
        gameState.player = new Player(canvas, gameState);
        initLevelSystem(gameState, canvas);
        applyCharacterToPlayer(gameState.player, gameState, characterKey);
        applyMetaAtRunStart(gameState);
        if (charModal) charModal.style.display = 'none';
        if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD();
    }

    if (btnGnorp) btnGnorp.addEventListener('click', () => startAs('Gnorp'));
    if (btnIgnis) btnIgnis.addEventListener('click', () => startAs('Ignis'));
    if (btnFizzle) btnFizzle.addEventListener('click', () => startAs('Fizzle'));
    // Mouse tracking for aim
    function updateMouse(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        // Convert to world coordinates using current camera
        const camX = (gameState.camera?.x || canvas.width / 2) - canvas.width / 2;
        const camY = (gameState.camera?.y || canvas.height / 2) - canvas.height / 2;
        gameState.mouse = { x: mx + camX, y: my + camY };
    }
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('mousedown', updateMouse);
    window.addEventListener('resize', resizeCanvas);
    const btnMute = document.getElementById('btnMute');
    let muted = false;
    if (btnMute) btnMute.addEventListener('click', () => {
        muted = !muted;
        setMuted(muted);
        btnMute.textContent = muted ? 'Unmute' : 'Mute';
    });
    const btnRestart = document.getElementById('btnRestart');
    if (btnRestart) btnRestart.addEventListener('click', restartRun);

    // Victory modal wiring
    const winModal = document.getElementById('gameWinModal');
    const winStats = document.getElementById('gameWinStats');
    const btnWinRestart = document.getElementById('btnWinRestart');
    const btnWinContinue = document.getElementById('btnWinContinue');
    function openWinModal() {
        if (winStats) {
            const lvl = gameState.level;
            const gems = gameState.totalGems;
            const inferno = gameState.meta?.gems || 0;
            winStats.textContent = `Level ${lvl} | Gems ${gems} | Inferno Gems ${inferno}`;
        }
        if (winModal) winModal.style.display = 'flex';
        gameState.paused = true;
    }
    if (btnWinRestart) btnWinRestart.addEventListener('click', () => {
        if (winModal) winModal.style.display = 'none';
        restartRun();
    });
    if (btnWinContinue) btnWinContinue.addEventListener('click', () => {
        if (winModal) winModal.style.display = 'none';
        gameState.paused = false;
    });
    // Expose so bosses can trigger
    gameState._openWinModal = openWinModal;
    window.addEventListener('keydown', e => {
        gameState.keys[e.code] = true;
        if (!gameState.player) return;
        if (e.code === 'Digit1') gameState.player.weapon = 'inferno';
        if (e.code === 'Digit2') gameState.player.weapon = 'flame';
        if (e.code === 'Digit3') gameState.player.weapon = 'orb';
        if (e.code === 'KeyP') gameState.paused = !gameState.paused;
    });
    window.addEventListener('keyup', e => gameState.keys[e.code] = false);
    gameLoop();
}

function boot() {
    const overlay = document.getElementById('loadingOverlay');
    const bar = document.getElementById('loadingProgress');
    function onProgress(ratio) {
        if (bar) bar.style.width = Math.max(0, Math.min(100, Math.floor(ratio * 100))) + '%';
    }
    preloadAll(onProgress).then(() => {
        if (overlay) overlay.style.display = 'none';
        init();
    });
}

boot();
