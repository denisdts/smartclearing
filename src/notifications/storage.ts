import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ENABLED_KEY = 'smartclearing.push-enabled';
const TOKEN_KEY = 'smartclearing.push-token';

async function readValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeValue(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage errors.
    }
    return;
  }

  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    // Ignore storage errors.
  }
}

export async function loadPushEnabled(): Promise<boolean> {
  return (await readValue(ENABLED_KEY)) === '1';
}

export function savePushEnabled(value: boolean): Promise<void> {
  return writeValue(ENABLED_KEY, value ? '1' : '0');
}

export function loadPushToken(): Promise<string | null> {
  return readValue(TOKEN_KEY);
}

export function savePushToken(value: string | null): Promise<void> {
  return writeValue(TOKEN_KEY, value);
}
