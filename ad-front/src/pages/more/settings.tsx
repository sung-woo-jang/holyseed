import { useNavigate } from 'react-router-dom';
import Border from '../../components/ui/Border';
import ListHeader from '../../components/ui/ListHeader';
import ListRow from '../../components/ui/ListRow';
import Switch from '../../components/ui/Switch';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';

export default function SettingsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { useMock, setUseMock } = useAuthStore();

  return (
    <div style={{ flex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bg }}>
      <ScreenHeader title="설정" onBack={() => navigate(-1)} />

      <Border type="full" height={16} />

      {/* 개발자 옵션 */}
      <ListHeader title={<ListHeader.TitleParagraph typography="t5">개발자 옵션</ListHeader.TitleParagraph>} />
      <ListRow
        contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>목업 데이터 사용</span>}
        right={<Switch checked={useMock} onCheckedChange={setUseMock} />}
        verticalPadding="small"
      />

      <Border type="full" height={16} />

      {/* 알림 */}
      <ListHeader title={<ListHeader.TitleParagraph typography="t5">알림</ListHeader.TitleParagraph>} />
      <ListRow
        contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>스냅샷 리마인더</span>}
        right={<Switch checked={false} onCheckedChange={() => {}} disabled />}
        verticalPadding="small"
      />
      <Border type="full" />
      <ListRow
        contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>정기지출 알림</span>}
        right={<Switch checked={false} onCheckedChange={() => {}} disabled />}
        verticalPadding="small"
      />

      <Border type="full" height={16} />

      {/* 통화 */}
      <ListHeader title={<ListHeader.TitleParagraph typography="t5">통화</ListHeader.TitleParagraph>} />
      <ListRow
        contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>기본 통화</span>}
        right={<span style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted }}>KRW</span>}
        verticalPadding="small"
      />

      <Border type="full" height={16} />

      <span style={{ textAlign: 'center', fontSize: 12, marginTop: 16, color: theme.textMuted }}>자산일기 v1.0</span>
    </div>
  );
}
