import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { ThemeName } from '@/theme';

const THEME_KEY = 'smartclearing.theme';

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  try {
    return await SecureStore.getItemAsync(THEME_KEY);
  } catch {
    return null;
  }
}

export async function loadTheme(): Promise<ThemeName | null> {
  const value = await readRaw();
  return value === 'dark' || value === 'light' ? value : null;
}

export async function saveTheme(value: ThemeName): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_KEY, value);
      }
    } catch {
      // Ignore storage errors: the in-memory theme still works.
    }
  }

  try {
    await SecureStore.setItemAsync(THEME_KEY, value);
  } catch {
    // Ignore storage errors: the in-memory theme still works.
  }
}
