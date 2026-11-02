import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../theme/palette';

const STORAGE_KEY = 'aura.theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState('system'); // 'system' | 'light' | 'dark'

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => { if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v); })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((value) => {
    if (!['system', 'light', 'dark'].includes(value)) return;
    setPreferenceState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {});
  }, []);

  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => ({
    colors: scheme === 'dark' ? darkColors : lightColors,
    isDark: scheme === 'dark',
    preference,
    setPreference,
  }), [scheme, preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
