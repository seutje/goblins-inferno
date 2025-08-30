// Debt system: pure logic helpers + integration hooks

export function createDebtState({
  initialDebt = 10000,
  interestPerMinute = 0.0, // simplified: 0 in-run, loans add principal directly
  autoRepayPerFrame = 0 // how much gold auto-applies to debt each frame
} = {}) {
  return {
    debt: initialDebt,
    gold: 0,
    interestPerMinute,
    autoRepayPerFrame,
  };
}

export function takeLoan(state, amount) {
  if (amount <= 0) return state;
  state.debt += amount;
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
  const modal = document.getElementById('loanModal');
  const btnOpen = document.getElementById('btnLoan');
  const btnClose = document.getElementById('loanClose');
  const btnSimple = document.getElementById('loanSimple');
  const btnGear = document.getElementById('loanGear');
  const btnCursed = document.getElementById('loanCursed');

  function refreshHUD() {
    if (debtEl) debtEl.textContent = Math.max(0, Math.floor(gameState.debt.debt)).toString();
    if (goldEl) goldEl.textContent = Math.max(0, Math.floor(gameState.debt.gold)).toString();
  }

  gameState._refreshDebtHUD = refreshHUD;

  function openModal() { modal.style.display = 'flex'; gameState.paused = true; }
  function closeModal() { modal.style.display = 'none'; gameState.paused = false; }

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);

  if (btnSimple) btnSimple.addEventListener('click', () => {
    // Simple Loan: +500 at 10% interest (simplified: principal only)
    takeLoan(gameState.debt, 500);
    refreshHUD();
  });
  if (btnGear) btnGear.addEventListener('click', () => {
    // Gear Loan: +1000 at 25% interest (simplified)
    takeLoan(gameState.debt, 1000);
    refreshHUD();
  });
  if (btnCursed) btnCursed.addEventListener('click', () => {
    // Cursed Loan: +2000 at 50% interest (simplified)
    takeLoan(gameState.debt, 2000);
    refreshHUD();
  });

  // initial paint
  refreshHUD();
}

