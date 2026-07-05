import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Switch({ checked, onCheckedChange, disabled = false }: SwitchProps) {
  return (
    // 행(ListRow) onPress로 클릭이 번지지 않게 차단
    <label className={styles.wrap} onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </label>
  );
}
