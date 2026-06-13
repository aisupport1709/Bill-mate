export function normalizePhone(input: string): string {
  const hasPlus = input.trim().startsWith('+');
  const digits = input.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function isValidPhone(input: string): boolean {
  return /^\+?\d{8,15}$/.test(normalizePhone(input));
}

// Firebase Auth enforces email uniqueness, which gives us phone uniqueness for free.
export function phoneToEmail(phone: string): string {
  return `${normalizePhone(phone).replace('+', 'p')}@billmate.app`;
}

export function emailToPhone(email: string): string {
  const local = email.split('@')[0];
  return local.startsWith('p') ? `+${local.slice(1)}` : local;
}
