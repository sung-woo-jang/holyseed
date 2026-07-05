import type { ReactNode } from 'react';
import styles from './TextButton.module.css';

interface TextButtonProps {
  typography?: 't5' | 't6';
  variant?: 'clear' | 'underline';
  color?: string;
  onPress?: () => void;
  children: ReactNode;
}

export default function TextButton({
  typography = 't5',
  variant = 'clear',
  color,
  onPress,
  children,
}: TextButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      style={{
        color: color ?? 'var(--brand)',
        fontSize: typography === 't6' ? 13 : 14,
        textDecoration: variant === 'underline' ? 'underline' : 'none',
      }}
      onClick={onPress}
    >
      {children}
    </button>
  );
}
