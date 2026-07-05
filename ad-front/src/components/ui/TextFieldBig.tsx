import type { CSSProperties } from 'react';
import styles from './TextFieldBig.module.css';

interface TextFieldBigProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  suffix?: string;
  autoFocus?: boolean;
  style?: CSSProperties;
}

export default function TextFieldBig({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  suffix,
  autoFocus,
  style,
}: TextFieldBigProps) {
  return (
    <div className={styles.field} style={style}>
      <input
        className={styles.input}
        type="text"
        inputMode={keyboardType === 'numeric' ? 'numeric' : undefined}
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChangeText(e.target.value)}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </div>
  );
}
