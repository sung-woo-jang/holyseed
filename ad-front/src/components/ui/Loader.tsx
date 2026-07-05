import styles from './Loader.module.css';

interface LoaderProps {
  size?: 'small' | 'large' | number;
  color?: string;
}

export default function Loader({ size = 'small', color }: LoaderProps) {
  const px = typeof size === 'number' ? size : size === 'large' ? 36 : 20;
  return (
    <span
      className={styles.spinner}
      style={{
        width: px,
        height: px,
        borderWidth: Math.max(2, Math.round(px / 10)),
        borderTopColor: color ?? 'var(--brand)',
      }}
    />
  );
}
