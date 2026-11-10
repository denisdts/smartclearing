import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { palettes, type Palette, type ThemeName } from '@/theme';
import { loadTheme, saveTheme } from '@/theme-storage';

type ThemeContextValue = {
  theme: ThemeName;
  colors: Palette;
  isDark: boolean;
  isReady: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadTheme()
      .then((stored) => {
        if (!cancelled && stored) {
          setThemeState(stored);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    void saveTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeName = current === 'dark' ? 'light' : 'dark';
      void saveTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      colors: palettes[theme],
      isDark: theme === 'dark',
      isReady,
      setTheme,
      toggleTheme,
    }),
    [theme, isReady, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within <ThemeProvider />');
  }
  return value;
}

export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
