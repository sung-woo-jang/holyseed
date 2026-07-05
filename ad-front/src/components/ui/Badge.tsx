import type { ReactNode } from 'react';
import cn from 'classnames';
import styles from './Badge.module.css';

type BadgeType = 'blue' | 'teal' | 'elephant' | 'red' | 'green';

interface BadgeProps {
  type?: BadgeType;
  badgeStyle?: 'weak' | 'fill';
  size?: 'tiny' | 'small' | 'medium';
  children: ReactNode;
}

export default function Badge({
  type = 'blue',
  badgeStyle = 'fill',
  size = 'small',
  children,
}: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[`size-${size}`], styles[`${type}-${badgeStyle}`])}>
      {children}
    </span>
  );
}
