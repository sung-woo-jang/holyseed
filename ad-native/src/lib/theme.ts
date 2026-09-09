import { useColorScheme } from 'react-native';

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
  bg: '#F6F7F9',
  card: '#FFFFFF',
  border: '#E6E8EB',
  text: '#191F28',
  textMuted: '#8B95A1',
  danger: '#FF3B30',
  dark: false,
};

export const DarkTheme: Theme = {
  brand: '#4D9FF6',
  brandSoft: '#1A2D45',
  bg: '#101114',
  card: '#1B1E24',
  border: '#2A2D33',
  text: '#F0F4F8',
  textMuted: '#9AA3B2',
  danger: '#FF453A',
  dark: true,
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}
