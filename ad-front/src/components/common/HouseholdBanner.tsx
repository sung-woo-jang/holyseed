import { useTheme } from '../../lib/theme';
import TossEmoji from './TossEmoji';
import { Icon } from './Icon';
import { TE } from '../../lib/toss-emoji';

interface HouseholdBannerProps {
  name: string;
  memberCount: number;
  ownerName: string;
  onRefresh?: () => void;
}

export default function HouseholdBanner({ name, memberCount, ownerName, onRefresh }: HouseholdBannerProps) {
  const theme = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '0 20px 8px',
        padding: 16,
        borderRadius: 16,
        border: `1px solid ${theme.border}`,
        background: theme.card,
      }}
    >
      <TossEmoji code={TE.house} size={48} bg={theme.brandSoft} borderRadius={12} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 16, fontWeight: 700, marginBottom: 2, color: theme.text }}>{name}</span>
        <span style={{ fontSize: 13, color: theme.textMuted }}>
          {memberCount}명 · {ownerName} 님이 소유
        </span>
      </div>
      {onRefresh && (
        <button type="button" onClick={onRefresh} style={{ padding: 8, margin: -8 }}>
          {Icon.refresh(theme.textMuted)}
        </button>
      )}
    </div>
  );
}
