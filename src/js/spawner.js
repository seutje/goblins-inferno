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
        gameState.enemies.push(new EnemyType(canvas, gameState));
        const base = gameState.balance?.spawnIntervalBase ?? gameState.spawnInterval;
        const min = gameState.balance?.spawnIntervalMin ?? 30;
        gameState.spawnTimer = Math.max(min, base - Math.floor(difficulty));
        gameState.difficulty += 1;
    } else {
        gameState.spawnTimer--;
        gameState.difficulty += 0.01;
    }
}
