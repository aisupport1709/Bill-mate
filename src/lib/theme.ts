export type ThemeMode = 'light' | 'dark' | 'auto';

export type ColorPalette = typeof lightColors;

export const lightColors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  inputBg: '#FFFFFF',
  segmentBg: '#E2E8F0',
};

export const darkColors: ColorPalette = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  danger: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  tabBar: '#1E293B',
  tabBarBorder: '#334155',
  inputBg: '#1E293B',
  segmentBg: '#334155',
};

// Static export kept for files that haven't been migrated yet.
// Prefer useColors() from SettingsContext in all new code.
export const colors = lightColors;

export const GROUP_COLORS = ['#2563EB', '#DB2777', '#16A34A', '#D97706', '#7C3AED', '#0891B2', '#DC2626', '#475569'];
export const GROUP_EMOJIS = ['🍜', '🏠', '✈️', '🎉', '☕️', '🏖️', '🎮', '💼', '🛒', '⚽️', '🎬', '🍻'];
