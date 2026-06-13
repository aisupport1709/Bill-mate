// No ambiguous characters (0/O, 1/I/L) so codes are easy to read aloud and type.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export function generateGroupCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function normalizeGroupCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

// "ABCDEFGH" → "ABCD EFGH" for display
export function displayGroupCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
}
