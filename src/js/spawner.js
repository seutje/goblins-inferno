import { DebtSkeleton, LoanerImp, BailiffOgre } from './enemy.js';

export function updateSpawner(gameState, canvas) {
    if (gameState.spawnTimer <= 0) {
        const difficulty = gameState.difficulty;
        const roll = Math.random();
        let EnemyType = DebtSkeleton;
        if (roll > 0.8 && difficulty > 20) {
            EnemyType = BailiffOgre;
        } else if (roll > 0.5 && difficulty > 10) {
            EnemyType = LoanerImp;
        }
        const enemy = new EnemyType(canvas, gameState);
        // Spawn the first few enemies closer to the center to ramp action faster
        if (gameState._spawnedTotal == null) gameState._spawnedTotal = 0;
        if (gameState._spawnedTotal < 5) {
            const W = (gameState.world?.width) || canvas.width;
            const H = (gameState.world?.height) || canvas.height;
            const cx = W / 2, cy = H / 2;
            const ang = Math.random() * Math.PI * 2;
            const r = 120 + Math.random() * 120; // spawn within ~120-240px of center
            let x = cx + Math.cos(ang) * r;
            let y = cy + Math.sin(ang) * r;
            const pad = 16;
            x = Math.max(pad, Math.min(W - pad, x));
            y = Math.max(pad, Math.min(H - pad, y));
            enemy.x = x;
            enemy.y = y;
        }
        gameState.enemies.push(enemy);
        gameState._spawnedTotal++;
        const base = gameState.balance?.spawnIntervalBase ?? gameState.spawnInterval;
        const min = gameState.balance?.spawnIntervalMin ?? 30;
        gameState.spawnTimer = Math.max(min, base - Math.floor(difficulty));
        gameState.difficulty += 1;
    } else {
        gameState.spawnTimer--;
        gameState.difficulty += 0.01;
    }
}
