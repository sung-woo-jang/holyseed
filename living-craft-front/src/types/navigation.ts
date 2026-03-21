import type { ReactNode } from 'react';

export interface NavigationItem {
  label: string;
  path: string;
  iconName?: string;
}

export interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  showBottomNav?: boolean;
}
