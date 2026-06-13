export interface AvatarPreset {
  emoji: string;
  color: string;
}

export const AVATARS: AvatarPreset[] = [
  { emoji: '😀', color: '#FDE68A' },
  { emoji: '😎', color: '#BFDBFE' },
  { emoji: '🦊', color: '#FED7AA' },
  { emoji: '🐱', color: '#FBCFE8' },
  { emoji: '🐼', color: '#E5E7EB' },
  { emoji: '🐸', color: '#BBF7D0' },
  { emoji: '🦄', color: '#E9D5FF' },
  { emoji: '🐯', color: '#FEF08A' },
  { emoji: '🐙', color: '#FECACA' },
  { emoji: '🐧', color: '#C7D2FE' },
  { emoji: '🍀', color: '#A7F3D0' },
  { emoji: '🌸', color: '#FBCFE8' },
  { emoji: '⚡️', color: '#FDE68A' },
  { emoji: '🔥', color: '#FED7AA' },
  { emoji: '🌊', color: '#BAE6FD' },
  { emoji: '⭐️', color: '#FEF9C3' },
];

export function avatarFor(avatarId: number | undefined): AvatarPreset {
  return AVATARS[(avatarId ?? 0) % AVATARS.length];
}
