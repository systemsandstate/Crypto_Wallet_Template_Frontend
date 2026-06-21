// API base URL — production domain used when app is not on localhost
import { Platform } from 'react-native';

const PRODUCTION_API = 'https://api.mohsinraza.xyz/api';
const LOCAL_API = 'http://localhost:5010/api';

function resolveApiBaseUrl(): string {
  // Web only: static builds may not embed EXPO_PUBLIC_* — detect host from the page URL.
  // Expo Go defines `window` but not `window.location`, so guard both.
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location?.hostname
  ) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return process.env.EXPO_PUBLIC_API_URL || LOCAL_API;
    }
    return PRODUCTION_API;
  }

  // Native (Expo Go / dev build): .env often has localhost — that targets the phone, not the server
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !/localhost|127\.0\.0\.1/.test(envUrl)) {
    return envUrl;
  }
  return PRODUCTION_API;
}

export const API_BASE_URL = resolveApiBaseUrl();
