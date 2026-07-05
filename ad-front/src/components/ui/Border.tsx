interface BorderProps {
  /** 'full' = 화면 폭 전체, 'padding' = 좌우 20px 여백 */
  type?: 'full' | 'padding';
  height?: number;
}

export default function Border({ type = 'full', height = 1 }: BorderProps) {
  return (
    <div
      style={{
        height,
        background: 'var(--border)',
        margin: type === 'padding' ? '0 20px' : 0,
        flexShrink: 0,
      }}
    />
  );
}
