import type { CSSProperties } from 'react';
import cn from 'classnames';
import styles from './TextField.module.css';

interface TextFieldProps {
  variant?: 'line' | 'box';
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  keyboardType?: 'default' | 'numeric';
  suffix?: string;
  maxLength?: number;
  autoFocus?: boolean;
  style?: CSSProperties;
}

export default function TextField({
  variant = 'box',
  placeholder,
  value,
  onChangeText,
  label,
  keyboardType = 'default',
  suffix,
  maxLength,
  autoFocus,
  style,
}: TextFieldProps) {
  return (
    <div className={styles.wrap} style={style}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={cn(styles.field, styles[variant])}>
        <input
          className={styles.input}
          type="text"
          inputMode={keyboardType === 'numeric' ? 'numeric' : undefined}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onChange={(e) => onChangeText(e.target.value)}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
    </div>
  );
}
