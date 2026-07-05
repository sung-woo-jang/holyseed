import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import EmptyState from '../components/common/EmptyState';
import { useTheme } from '../lib/theme';
import { TE } from '../lib/toss-emoji';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <div
      style={{
        flex: 1,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 24,
        background: theme.bg,
      }}
    >
      <EmptyState iconCode={TE.search} title="페이지를 찾을 수 없어요" desc="주소가 잘못되었거나 삭제된 페이지예요" />
      <Button display="full" size="big" type="primary" style="weak" onPress={() => navigate('/')}>
        홈으로 가기
      </Button>
    </div>
  );
}
