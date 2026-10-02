export type Hex = `#${string}`;

export interface Palette {
  bg: Hex;
  surface: Hex;
  text: Hex;
  muted: Hex;
  brand: Hex;
  brandSoft: Hex;
  danger: Hex;
}

export const LIGHT: Palette = {
  bg: '#FFFFFF',
  surface: '#F2F4F6',
  text: '#191F28',
  muted: '#8B95A1',
  brand: '#3182F6',
  brandSoft: '#EBF3FF',
  danger: '#F04452',
};

export const DARK: Palette = {
  bg: '#1B1E24',
  surface: '#272B33',
  text: '#F0F4F8',
  muted: '#9AA3B2',
  brand: '#4D9FF6',
  brandSoft: '#1A2D45',
  danger: '#FF6B6B',
};
