import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'smartclearing.session';

export async function loadSession(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  try {
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function saveSession(value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      if (value === null) {
        localStorage.removeItem(SESSION_KEY);
      } else {
        localStorage.setItem(SESSION_KEY, value);
      }
    } catch {
      return;
    }
  }

  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } else {
      await SecureStore.setItemAsync(SESSION_KEY, value);
    }
  } catch {
    // Ignore storage errors: the in-memory session still works.
  }
}
