// Debt system: pure logic helpers + integration hooks
import { playSound } from './audio.js';

// Persistent storage helpers (safe in non-browser envs)
const STORAGE_KEY = 'goblins-inferno:debt';
function canStore() { try { return typeof localStorage !== 'undefined'; } catch { return false; } }
function loadStoredDebt() {
  if (!canStore()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const debt = Math.max(0, Number(parsed.debt || 0));
    const gold = Math.max(0, Number(parsed.gold || 0));
    return { debt, gold };
  } catch { return null; }
}
function saveStoredDebt(state) {
  if (!canStore() || !state) return;
  try {
    const payload = JSON.stringify({ debt: Math.max(0, Math.floor(state.debt || 0)), gold: Math.max(0, Math.floor(state.gold || 0)) });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {}
}

export function createDebtState({
  initialDebt = 10000,
  interestPerMinute = 0.0, // optional continuous interest (unused by default)
  autoRepayPerFrame = 0 // how much gold auto-applies to debt each frame
} = {}) {
  const stored = loadStoredDebt();
  const state = {
    debt: stored?.debt ?? initialDebt,
    gold: stored?.gold ?? 0,
    interestPerMinute,
    autoRepayPerFrame,
  };
  // Ensure we persist at least the initial state
  saveStoredDebt(state);
  return state;
}

export function takeLoan(state, amount, { rate = 0 } = {}) {
  if (amount <= 0) return state;
  const fee = Math.round(amount * rate);
  state.debt += (amount + fee);
  state.gold += amount;
  saveStoredDebt(state);
  return state;
}

export function collectGold(state, amount) {
  if (amount <= 0) return state;
  state.gold += amount;
  saveStoredDebt(state);
  return state;
}

export function repay(state, amount) {
  if (amount <= 0) return state;
  const pay = Math.min(amount, state.gold, state.debt);
  state.gold -= pay;
  state.debt -= pay;
  saveStoredDebt(state);
  return state;
}

// Frame-based update used in the main loop
export function updateDebt(state) {
  if (!state) return;
  if (state.autoRepayPerFrame && state.autoRepayPerFrame > 0) {
    repay(state, state.autoRepayPerFrame);
  }
  // Periodic persistence to cover interest or any external mutations
  saveStoredDebt(state);
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
  function closeModal() {
    modal.style.display = 'none';
    // After closing the loan shark, pause and open HUD menu
    try { if (gameState && typeof gameState._openHudMenu === 'function') gameState._openHudMenu(); } catch {}
    gameState.paused = true;
  }

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
    playSound('loan');
    refreshHUD();
  });
  if (btnCursed) btnCursed.addEventListener('click', () => {
    // Cursed Loan: +2000 at 50% fixed interest, explosion + temporary speed debuff
    takeLoan(gameState.debt, 2000, { rate: 0.50 });
    playSound('loan');
    refreshHUD();
  });

  // initial paint
  refreshHUD();
}
