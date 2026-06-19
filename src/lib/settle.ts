export interface Transfer {
  from: string;
  to: string;
  amountK: number;
}

// Min-cash-flow: repeatedly match the biggest debtor against the biggest
// creditor. Re-sorts on every iteration so partial settlements are handled
// correctly and floating-point drift doesn't cause infinite loops.
export function minCashFlow(net: Record<string, number>): Transfer[] {
  // Work with mutable copies, skip zero balances
  const balances: { uid: string; amount: number }[] = Object.entries(net)
    .filter(([, v]) => Math.abs(v) >= 1)
    .map(([uid, amount]) => ({ uid, amount }));

  const transfers: Transfer[] = [];

  for (let iter = 0; iter < balances.length * 2; iter++) {
    balances.sort((a, b) => b.amount - a.amount);

    const creditor = balances[0];
    const debtor = balances[balances.length - 1];

    if (!creditor || !debtor || creditor.amount < 1 || debtor.amount > -1) break;

    const pay = Math.min(creditor.amount, -debtor.amount);
    if (pay < 1) break;

    transfers.push({ from: debtor.uid, to: creditor.uid, amountK: Math.round(pay) });

    creditor.amount -= pay;
    debtor.amount += pay;
  }

  return transfers;
}
