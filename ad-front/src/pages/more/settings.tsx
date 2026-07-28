import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Border from '../../components/ui/Border';
import Button from '../../components/ui/Button';
import ListHeader from '../../components/ui/ListHeader';
import ListRow from '../../components/ui/ListRow';
import Switch from '../../components/ui/Switch';
import ScreenHeader from '../../components/common/ScreenHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppToast from '../../components/common/AppToast';
import McpTokenSheet from '../../components/sheets/McpTokenSheet';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { useMcpTokens, useDeleteMcpToken } from '../../queries/mutations';

export default function SettingsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { useMock, setUseMock } = useAuthStore();
  const { data: mcpTokens = [] } = useMcpTokens();
  const deleteMcpToken = useDeleteMcpToken();
  const [tokenSheetVisible, setTokenSheetVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [toast, setToast] = useState('');

  async function confirmDeleteToken() {
    if (!deleteTarget) return;
    try {
      await deleteMcpToken.mutateAsync(deleteTarget.id);
      setToast('토큰을 삭제했어요');
    } catch {
      setToast('삭제에 실패했어요');
    } finally {
      setDeleteTarget(null);
    }
  }

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

      {/* MCP 연동 */}
      <ListHeader title={<ListHeader.TitleParagraph typography="t5">MCP 연동</ListHeader.TitleParagraph>} />
      {mcpTokens.length === 0 ? (
        <ListRow
          contents={<span style={{ color: theme.textMuted, fontSize: 14 }}>발급된 토큰이 없어요</span>}
          verticalPadding="small"
        />
      ) : (
        mcpTokens.map((t, idx) => (
          <div key={t.id}>
            <ListRow
              contents={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>{t.label || '라벨 없음'}</span>
                  <span style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                    {new Date(t.createdAt).toLocaleDateString('ko-KR')} 발급
                  </span>
                </div>
              }
              right={
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(t.connectorUrl).catch(() => {})}
                  >
                    <span style={{ color: theme.brand, fontSize: 13, fontWeight: 600 }}>복사</span>
                  </button>
                  <button type="button" onClick={() => setDeleteTarget({ id: t.id, label: t.label || '라벨 없음' })}>
                    <span style={{ color: theme.danger, fontSize: 13, fontWeight: 600 }}>삭제</span>
                  </button>
                </div>
              }
              verticalPadding="small"
            />
            {idx < mcpTokens.length - 1 && <Border type="full" />}
          </div>
        ))
      )}
      <div style={{ padding: '12px 20px' }}>
        <Button display="full" size="big" type="primary" style="weak" onPress={() => setTokenSheetVisible(true)}>
          + 토큰 발급
        </Button>
      </div>

      <Border type="full" height={16} />

      <span style={{ textAlign: 'center', fontSize: 12, marginTop: 16, color: theme.textMuted }}>자산일기 v1.0</span>

      <McpTokenSheet visible={tokenSheetVisible} onClose={() => setTokenSheetVisible(false)} />
      <ConfirmDialog
        visible={!!deleteTarget}
        title="MCP 토큰을 삭제할까요?"
        description={deleteTarget ? `"${deleteTarget.label}" 토큰으로 연결된 claude.ai 커넥터가 더 이상 동작하지 않아요.` : undefined}
        confirmText="삭제하기"
        danger
        loading={deleteMcpToken.isPending}
        onConfirm={confirmDeleteToken}
        onClose={() => setDeleteTarget(null)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </div>
  );
}
