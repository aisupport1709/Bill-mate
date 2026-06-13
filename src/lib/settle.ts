export interface Transfer {
  from: string;
  to: string;
  amountK: number;
}

// Min-cash-flow: repeatedly settle the largest debtor against the largest
// creditor, producing at most (n - 1) transfers to clear all balances.
export function minCashFlow(net: Record<string, number>): Transfer[] {
  const creditors: { uid: string; amount: number }[] = [];
  const debtors: { uid: string; amount: number }[] = [];

  for (const [uid, balance] of Object.entries(net)) {
    if (balance > 0) creditors.push({ uid, amount: balance });
    else if (balance < 0) debtors.push({ uid, amount: -balance });
  }

  const transfers: Transfer[] = [];
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(creditors[ci].amount, debtors[di].amount);
    if (pay > 0) {
      transfers.push({ from: debtors[di].uid, to: creditors[ci].uid, amountK: pay });
    }
    creditors[ci].amount -= pay;
    debtors[di].amount -= pay;
    if (creditors[ci].amount === 0) ci++;
    if (debtors[di].amount === 0) di++;
  }
  return transfers;
}
