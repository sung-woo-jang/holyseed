import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type IconFn = (color?: string, size?: number) => React.ReactElement;

const icon = (path: React.ReactElement, vb = '0 0 24 24', defaultSize = 24): IconFn =>
  (color = 'currentColor', size = defaultSize) => (
    <Svg width={size} height={size} viewBox={vb} fill="none">
      {React.cloneElement(path, { stroke: color } as object)}
    </Svg>
  );

export const Icon = {
  home: (color = '#8B95A1', size = 24) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  ),
  wallet: (color = '#8B95A1', size = 24) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2z"
        stroke={color} strokeWidth="1.8" />
      <Path d="M3 10h18M16 14h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  book: (color = '#8B95A1', size = 24) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M8 7h6M8 11h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  more: (color = '#8B95A1', size = 24) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="12" r="1.6" fill={color} />
      <Circle cx="12" cy="12" r="1.6" fill={color} />
      <Circle cx="19" cy="12" r="1.6" fill={color} />
    </Svg>
  ),
  back: (color = '#191F28', size = 24) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  close: (color = '#191F28', size = 24) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  plus: (color = '#fff', size = 24) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  ),
  chevronRight: (color = '#8B95A1', size = 16) => (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M6 4l4 4-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  chevronDown: (color = '#8B95A1', size = 16) => (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M4 6l4 4 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  arrowUp: (color = '#3182F6', size = 14) => (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M7 11V3M3 7l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  bell: (color = '#191F28', size = 22) => (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M5 9a6 6 0 1112 0v3l1.5 3h-15L5 12V9z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M9 18a2 2 0 004 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  search: (color = '#8B95A1', size = 22) => (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx="10" cy="10" r="6" stroke={color} strokeWidth="1.8" />
      <Path d="M14.5 14.5L18 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  check: (color = '#3182F6', size = 20) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M4 10l4 4 8-8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  refresh: (color = '#8B95A1', size = 18) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M3 9a6 6 0 0110-4.5L15 6M15 9a6 6 0 01-10 4.5L3 12M15 3v3h-3M3 15v-3h3"
        stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
};

// Suppress the TS error from `icon` helper unused warning
void icon;
