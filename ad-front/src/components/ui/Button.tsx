import type { ReactNode } from 'react';
import cn from 'classnames';
import Loader from './Loader';
import styles from './Button.module.css';

interface ButtonProps {
  display?: 'full' | 'inline';
  size?: 'big' | 'medium' | 'small';
  type?: 'primary' | 'danger' | 'dark';
  /** TDS 호환: 'fill'(기본) | 'weak' */
  style?: 'fill' | 'weak';
  disabled?: boolean;
  loading?: boolean;
  leftAccessory?: ReactNode;
  onPress?: () => void;
  children: ReactNode;
}

export default function Button({
  display = 'inline',
  size = 'medium',
  type = 'primary',
  style: variant = 'fill',
  disabled = false,
  loading = false,
  leftAccessory,
  onPress,
  children,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        styles.button,
        styles[`size-${size}`],
        styles[`${type}-${variant}`],
        display === 'full' && styles.full,
      )}
      disabled={disabled || loading}
      onClick={onPress}
    >
      {loading ? (
        <Loader color={variant === 'weak' ? undefined : '#fff'} />
      ) : (
        <>
          {leftAccessory && <span className={styles.accessory}>{leftAccessory}</span>}
          {children}
        </>
      )}
    </button>
  );
}
