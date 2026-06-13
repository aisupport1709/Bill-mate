// Amounts are stored as integer thousands of VND ("K"). 100 = 100,000 ₫ = "100K".
export function formatK(amountK: number): string {
  return `${Math.round(amountK).toLocaleString('en-US')}K`;
}

export function parseK(text: string): number | null {
  const digits = text.replace(/[,.\s]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  const value = parseInt(digits, 10);
  return value > 0 ? value : null;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${formatDate(toISODate(d))} ${hh}:${mm}`;
}
