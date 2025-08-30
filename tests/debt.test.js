import { createDebtState, takeLoan, collectGold, repay, updateDebt } from '../src/debt.js';

describe('Debt System', () => {
  test('taking a loan increases debt and gold', () => {
    const debt = createDebtState({ initialDebt: 1000 });
    takeLoan(debt, 500);
    expect(debt.debt).toBe(1500);
    expect(debt.gold).toBe(500);
  });

  test('collecting gold then auto-repay reduces debt', () => {
    const debt = createDebtState({ initialDebt: 1000, autoRepayPerFrame: 10 });
    collectGold(debt, 50);
    updateDebt(debt); // repay 10
    expect(debt.debt).toBe(990);
    expect(debt.gold).toBe(40);
  });

  test('manual repay caps at available gold and debt', () => {
    const debt = createDebtState({ initialDebt: 20 });
    collectGold(debt, 5);
    repay(debt, 50);
    expect(debt.debt).toBe(15);
    expect(debt.gold).toBe(0);
  });
});

