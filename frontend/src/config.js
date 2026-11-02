import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolves the backend URL automatically:
 *  1. EXPO_PUBLIC_API_URL (set it in frontend/.env to override)
 *  2. Web: same host as the page, port 8000
 *  3. Expo Go on a phone/emulator: the computer's LAN IP from the Metro bundler, port 8000
 */
const API_PORT = 8000;

function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api`;
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  let host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
  return `http://${host}:${API_PORT}/api`;
}

export const API_URL = resolveApiUrl();
export const REQUEST_TIMEOUT_MS = 60000;
