import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { useTheme } from './ThemeContext';

const TOKEN_KEY = 'aura.token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { setPreference } = useTheme();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [booting, setBooting] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setStats(null);
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  }, []);

  const startSession = useCallback(async (token, u) => {
    setAuthToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
    setUser(u);
    if (u?.theme) setPreference(u.theme);
  }, [setPreference]);

  // Restore a saved session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => { clearSession(); });
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const data = await authApi.me();
          setUser(data.user);
          setStats(data.stats);
          if (data.user?.theme) setPreference(data.user.theme);
        }
      } catch (e) {
        // Keep the token if the server is just unreachable; drop it if it was rejected.
        if (e.status === 401) await clearSession();
        else setAuthToken(null);
      } finally {
        setBooting(false);
      }
    })();
  }, [clearSession, setPreference]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    await startSession(data.token, data.user);
  }, [startSession]);

  const register = useCallback(async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    await startSession(data.token, data.user);
  }, [startSession]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore network errors on logout */ }
    await clearSession();
  }, [clearSession]);

  const refresh = useCallback(async () => {
    const data = await authApi.me();
    setUser(data.user);
    setStats(data.stats);
    return data;
  }, []);

  const value = useMemo(
    () => ({ user, stats, booting, login, register, logout, refresh, setUser }),
    [user, stats, booting, login, register, logout, refresh]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
