import type { CSSProperties, KeyboardEvent, Ref } from 'react';
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
  inputRef?: Ref<HTMLInputElement>;
  onFocus?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
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
  inputRef,
  onFocus,
  onKeyDown,
}: TextFieldProps) {
  return (
    <div className={styles.wrap} style={style}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={cn(styles.field, styles[variant])}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          inputMode={keyboardType === 'numeric' ? 'numeric' : undefined}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onChange={(e) => onChangeText(e.target.value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
    </div>
  );
}
