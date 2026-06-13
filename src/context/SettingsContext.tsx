import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { getStrings, Language, Strings } from '../lib/i18n';
import { ColorPalette, darkColors, lightColors, ThemeMode } from '../lib/theme';

interface Settings {
  language: Language;
  themeMode: ThemeMode;
  colors: ColorPalette;
  t: Strings;
  setLanguage: (l: Language) => void;
  setThemeMode: (m: ThemeMode) => void;
}

const SettingsContext = createContext<Settings>({
  language: 'vi',
  themeMode: 'auto',
  colors: lightColors,
  t: getStrings('vi'),
  setLanguage: () => {},
  setThemeMode: () => {},
});

const STORAGE_KEY_LANG = '@bm_language';
const STORAGE_KEY_THEME = '@bm_theme';

function loadItem(key: string): string | null {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    // AsyncStorage is lazy-required to keep the web bundle clean.
    // On native this runs synchronously at startup via the cache.
    return null; // native async load handled in useEffect
  } catch {
    return null;
  }
}

function saveItem(key: string, value: string) {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const AS = require('@react-native-async-storage/async-storage').default;
      AS.setItem(key, value);
    }
  } catch {}
}

function resolveColors(mode: ThemeMode): ColorPalette {
  if (mode === 'dark') return darkColors;
  if (mode === 'light') return lightColors;
  // auto — follow system
  const scheme = Appearance.getColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('vi');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [colors, setColors] = useState<ColorPalette>(resolveColors('auto'));

  // Load persisted settings on mount.
  useEffect(() => {
    if (Platform.OS === 'web') {
      const lang = loadItem(STORAGE_KEY_LANG) as Language | null;
      const theme = loadItem(STORAGE_KEY_THEME) as ThemeMode | null;
      if (lang) setLangState(lang);
      if (theme) {
        setThemeModeState(theme);
        setColors(resolveColors(theme));
      }
    } else {
      const AS = require('@react-native-async-storage/async-storage').default;
      Promise.all([AS.getItem(STORAGE_KEY_LANG), AS.getItem(STORAGE_KEY_THEME)]).then(
        ([lang, theme]: [string | null, string | null]) => {
          if (lang) setLangState(lang as Language);
          if (theme) {
            setThemeModeState(theme as ThemeMode);
            setColors(resolveColors(theme as ThemeMode));
          }
        }
      );
    }
  }, []);

  // Re-resolve colors when system appearance changes (for 'auto' mode).
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      setColors(resolveColors(themeMode));
    });
    return () => sub.remove();
  }, [themeMode]);

  const setLanguage = useCallback((l: Language) => {
    setLangState(l);
    saveItem(STORAGE_KEY_LANG, l);
  }, []);

  const setThemeMode = useCallback((m: ThemeMode) => {
    setThemeModeState(m);
    setColors(resolveColors(m));
    saveItem(STORAGE_KEY_THEME, m);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ language, themeMode, colors, t: getStrings(language), setLanguage, setThemeMode }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useColors(): ColorPalette {
  return useContext(SettingsContext).colors;
}

export function useT(): Strings {
  return useContext(SettingsContext).t;
}
