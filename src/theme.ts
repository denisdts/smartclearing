export type ThemeName = 'dark' | 'light';

export type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryDark: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  warning: string;
  highlight: string;
  highlightBorder: string;
  highlightText: string;
  highlightTextMuted: string;
};

export const darkColors: Palette = {
  background: '#0B1F33',
  surface: '#13293D',
  surfaceAlt: '#1B3550',
  primary: '#12C2A0',
  primaryDark: '#0E9C81',
  text: '#FFFFFF',
  textMuted: '#9FB3C8',
  border: '#24425F',
  danger: '#FF6B6B',
  warning: '#F5B942',
  highlight: '#F5B942',
  highlightBorder: '#D99A2B',
  highlightText: '#13293D',
  highlightTextMuted: '#4A5568',
};

export const lightColors: Palette = {
  background: '#FFFFFF',
  surface: '#F4F7FA',
  surfaceAlt: '#E6EDF3',
  primary: '#0B7F69',
  primaryDark: '#096A58',
  text: '#0B1F33',
  textMuted: '#5B7186',
  border: '#D3DEE8',
  danger: '#D64545',
  warning: '#B26B00',
  highlight: '#F5B942',
  highlightBorder: '#D99A2B',
  highlightText: '#13293D',
  highlightTextMuted: '#4A5568',
};

export const palettes: Record<ThemeName, Palette> = {
  dark: darkColors,
  light: lightColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};
