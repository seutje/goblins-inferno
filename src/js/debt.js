// Debt system: pure logic helpers + integration hooks
import { playSound } from './audio.js';
import { spawnFirePatch } from './hazard.js';

export function createDebtState({
  initialDebt = 10000,
  interestPerMinute = 0.0, // optional continuous interest (unused by default)
  autoRepayPerFrame = 0 // how much gold auto-applies to debt each frame
} = {}) {
  return {
    debt: initialDebt,
    gold: 0,
    interestPerMinute,
    autoRepayPerFrame,
  };
}

export function takeLoan(state, amount, { rate = 0 } = {}) {
  if (amount <= 0) return state;
  const fee = Math.round(amount * rate);
  state.debt += (amount + fee);
  state.gold += amount;
  return state;
}

export function collectGold(state, amount) {
  if (amount <= 0) return state;
  state.gold += amount;
  return state;
}

export function repay(state, amount) {
  if (amount <= 0) return state;
  const pay = Math.min(amount, state.gold, state.debt);
  state.gold -= pay;
  state.debt -= pay;
  return state;
}

// Frame-based update used in the main loop
export function updateDebt(state) {
  if (!state) return;
  if (state.autoRepayPerFrame && state.autoRepayPerFrame > 0) {
    repay(state, state.autoRepayPerFrame);
  }
}

// UI integration for HUD and Loan Shark modal
export function initDebtUI(gameState) {
  const debtEl = document.getElementById('hud-debt');
  const goldEl = document.getElementById('hud-gold');
  const lvlEl = document.getElementById('hud-level');
  const xpEl = document.getElementById('hud-xp');
  const nextEl = document.getElementById('hud-next');
  const modal = document.getElementById('loanModal');
  const btnOpen = document.getElementById('btnLoan');
  const btnClose = document.getElementById('loanClose');
  const btnSimple = document.getElementById('loanSimple');
  const btnGear = document.getElementById('loanGear');
  const btnCursed = document.getElementById('loanCursed');
  const hpEl = document.getElementById('hud-hp');

  function refreshHUD() {
    if (debtEl) debtEl.textContent = Math.max(0, Math.floor(gameState.debt.debt)).toString();
    if (goldEl) goldEl.textContent = Math.max(0, Math.floor(gameState.debt.gold)).toString();
    if (lvlEl) lvlEl.textContent = (gameState.level || 1).toString();
    if (xpEl) xpEl.textContent = (gameState.xp || 0).toString();
    if (nextEl) nextEl.textContent = (gameState.nextLevelXp || 5).toString();
    if (hpEl && gameState.player) hpEl.textContent = String(Math.max(0, Math.ceil(gameState.player.hp)));
  }

  gameState._refreshDebtHUD = refreshHUD;

  function openModal() { modal.style.display = 'flex'; gameState.paused = true; }
  function closeModal() { modal.style.display = 'none'; gameState.paused = false; }

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);

  if (btnSimple) btnSimple.addEventListener('click', () => {
    // Simple Loan: +500 at 10% fixed interest
    takeLoan(gameState.debt, 500, { rate: 0.10 });
    playSound('loan');
    refreshHUD();
  });
  if (btnGear) btnGear.addEventListener('click', () => {
    // Gear Loan: +1000 at 25% fixed interest, grants a gear buff for the run
    takeLoan(gameState.debt, 1000, { rate: 0.25 });
    if (!gameState._metaMods) gameState._metaMods = {};
    gameState._metaMods.multishot = (gameState._metaMods.multishot || 0) + 1;
    gameState._metaMods.bounce = (gameState._metaMods.bounce || 0) + 1;
    playSound('loan');
    refreshHUD();
  });
  if (btnCursed) btnCursed.addEventListener('click', () => {
    // Cursed Loan: +2000 at 50% fixed interest, explosion + temporary speed debuff
    takeLoan(gameState.debt, 2000, { rate: 0.50 });
    const p = gameState.player;
    if (p) {
      const angles = 16;
      const radius = 60;
      for (let i = 0; i < angles; i++) {
        const a = (i / angles) * Math.PI * 2;
        const x = p.x + Math.cos(a) * radius;
        const y = p.y + Math.sin(a) * radius;
        spawnFirePatch(gameState, x, y, { radius: 24, duration: 120, dps: 1.0 });
      }
      const debuff = 0.75; // -25% speed for 8s
      p.stats.speedMultiplier *= debuff;
      if (!gameState._buffs) gameState._buffs = [];
      gameState._buffs.push({ key:'slow', label:'Slowed', icon:'⛓', color:'#ff6b6b', remaining: 60 * 8, undo: () => { p.stats.speedMultiplier /= debuff; } });
    }
    playSound('loan');
    refreshHUD();
  });

  // initial paint
  refreshHUD();
}
