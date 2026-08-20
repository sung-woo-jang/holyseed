import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Updates from 'expo-updates';
import Border from '../../components/ui/Border';
import Button from '../../components/ui/Button';
import ListHeader from '../../components/ui/ListHeader';
import ListRow from '../../components/ui/ListRow';
import Switch from '../../components/ui/Switch';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppToast from '../../components/common/AppToast';
import McpTokenSheet from '../../components/sheets/McpTokenSheet';
import { useTheme } from '../../lib/theme';
import { useMcpTokens, useDeleteMcpToken } from '../../queries/mutations';

export default function SettingsScreen() {
  const theme = useTheme();
  const { data: mcpTokens = [] } = useMcpTokens();
  const deleteMcpToken = useDeleteMcpToken();
  const [tokenSheetVisible, setTokenSheetVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [toast, setToast] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const updateLabel = Updates.isEmbeddedLaunch ? '내장 빌드 (OTA 미적용)' : `업데이트 적용됨 · ${Updates.updateId?.slice(0, 8) ?? '?'}`;

  async function handleCheckUpdate() {
    setCheckingUpdate(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert('최신 버전', '이미 최신 버전을 쓰고 있어요.');
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('업데이트 발견', '새 버전을 받았어요. 지금 적용할까요?', [
        { text: '나중에', style: 'cancel' },
        { text: '지금 적용', onPress: () => Updates.reloadAsync() },
      ]);
    } catch (e) {
      Alert.alert('확인 실패', e instanceof Error ? e.message : '알 수 없는 오류예요.');
    } finally {
      setCheckingUpdate(false);
    }
  }

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
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Border type="full" height={16} />

        <ListHeader title={<ListHeader.TitleParagraph typography="t5">알림</ListHeader.TitleParagraph>} />
        <ListRow contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>스냅샷 리마인더</Text>} right={<Switch checked={false} onCheckedChange={() => {}} disabled />} verticalPadding="small" />
        <Border type="full" />
        <ListRow contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>정기지출 알림</Text>} right={<Switch checked={false} onCheckedChange={() => {}} disabled />} verticalPadding="small" />

        <Border type="full" height={16} />

        <ListHeader title={<ListHeader.TitleParagraph typography="t5">통화</ListHeader.TitleParagraph>} />
        <ListRow contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>기본 통화</Text>} right={<Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '600' }}>KRW</Text>} verticalPadding="small" />

        <Border type="full" height={16} />

        <ListHeader title={<ListHeader.TitleParagraph typography="t5">MCP 연동</ListHeader.TitleParagraph>} />
        {mcpTokens.length === 0 ? (
          <ListRow contents={<Text style={{ color: theme.textMuted, fontSize: 14 }}>발급된 토큰이 없어요</Text>} verticalPadding="small" />
        ) : (
          mcpTokens.map((t, idx) => (
            <View key={t.id}>
              <ListRow
                contents={
                  <View>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{t.label || '라벨 없음'}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{new Date(t.createdAt).toLocaleDateString('ko-KR')} 발급</Text>
                  </View>
                }
                right={
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable onPress={() => Clipboard.setStringAsync(t.connectorUrl)}>
                      <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '600' }}>복사</Text>
                    </Pressable>
                    <Pressable onPress={() => setDeleteTarget({ id: t.id, label: t.label || '라벨 없음' })}>
                      <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '600' }}>삭제</Text>
                    </Pressable>
                  </View>
                }
                verticalPadding="small"
              />
              {idx < mcpTokens.length - 1 && <Border type="full" />}
            </View>
          ))
        )}
        <View style={{ padding: 20 }}>
          <Button display="full" size="big" type="primary" style="weak" onPress={() => setTokenSheetVisible(true)}>
            + 토큰 발급
          </Button>
        </View>

        <Border type="full" height={16} />

        <ListHeader title={<ListHeader.TitleParagraph typography="t5">업데이트</ListHeader.TitleParagraph>} />
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 10 }}>{updateLabel}</Text>
          <Button display="full" size="medium" type="primary" style="weak" loading={checkingUpdate} onPress={handleCheckUpdate}>
            지금 업데이트 확인
          </Button>
        </View>

        <Border type="full" height={16} />

        <Text style={{ textAlign: 'center', fontSize: 12, marginTop: 16, color: theme.textMuted }}>자산일기 v1.0</Text>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
