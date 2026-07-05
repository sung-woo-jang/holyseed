import { useTheme } from '../../lib/theme';
import TossEmoji from './TossEmoji';

interface EmptyStateProps {
  /** TE 코드 (toss-emoji.ts). 미지정 시 mailbox */
  iconCode?: string;
  title: string;
  desc?: string;
  compact?: boolean;
}

export default function EmptyState({ iconCode = '1F4ED', title, desc, compact = false }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: compact ? '28px 32px' : '48px 32px',
        gap: 10,
      }}
    >
      <TossEmoji code={iconCode} size={compact ? 40 : 48} />
      <span style={{ fontSize: 15, fontWeight: 600, textAlign: 'center', color: theme.text }}>{title}</span>
      {desc && (
        <span style={{ fontSize: 13, textAlign: 'center', lineHeight: '18px', color: theme.textMuted }}>{desc}</span>
      )}
    </div>
  );
}
