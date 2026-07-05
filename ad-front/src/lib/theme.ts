import { useSyncExternalStore } from 'react';

export interface Theme {
  brand: string;
  brandSoft: string;
  bg: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  danger: string;
  dark: boolean;
}

export const LightTheme: Theme = {
  brand: '#3182F6',
  brandSoft: '#EBF3FF',
  bg: '#F2F4F6',
  card: '#FFFFFF',
  border: '#F2F4F6',
  text: '#191F28',
  textMuted: '#8B95A1',
  danger: '#FF3B30',
  dark: false,
};

export const DarkTheme: Theme = {
  brand: '#4D9FF6',
  brandSoft: '#1A2D45',
  bg: '#0F1115',
  card: '#1C2028',
  border: '#2C313A',
  text: '#F0F4F8',
  textMuted: '#6B7684',
  danger: '#FF453A',
  dark: true,
};

const media = window.matchMedia('(prefers-color-scheme: dark)');

function subscribe(onChange: () => void) {
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function useTheme(): Theme {
  const isDark = useSyncExternalStore(subscribe, () => media.matches);
  return isDark ? DarkTheme : LightTheme;
}
