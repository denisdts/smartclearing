import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'smartclearing.session';
const REMEMBER_AUTH_KEY = 'smartclearing.remember-auth';

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
      // Ignore storage errors: the in-memory state still works.
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
    // Ignore storage errors: the in-memory state still works.
  }
}

export function loadSession(): Promise<string | null> {
  return readValue(SESSION_KEY);
}

export function saveSession(value: string | null): Promise<void> {
  return writeValue(SESSION_KEY, value);
}

export async function loadRememberAuth(): Promise<boolean> {
  const value = await readValue(REMEMBER_AUTH_KEY);

  return value === null ? true : value === '1';
}

export function saveRememberAuth(value: boolean): Promise<void> {
  return writeValue(REMEMBER_AUTH_KEY, value ? '1' : '0');
}
