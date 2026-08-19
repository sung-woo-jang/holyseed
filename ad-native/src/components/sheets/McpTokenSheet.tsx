import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useCreateMcpToken } from '../../queries/mutations';
import { getErrorMessage } from '../../lib/error';

interface McpTokenSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function McpTokenSheet({ visible, onClose }: McpTokenSheetProps) {
  const theme = useTheme();
  const [label, setLabel] = useState('');
  const [connectorUrl, setConnectorUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const createToken = useCreateMcpToken();

  async function handleCreate() {
    setError('');
    try {
      const result = await createToken.mutateAsync(label.trim() || undefined);
      setConnectorUrl(result.connectorUrl);
    } catch (e: any) {
      setError(getErrorMessage(e, 'MCP 토큰 발급에 실패했어요.'));
    }
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(connectorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setLabel('');
    setConnectorUrl('');
    setError('');
    setCopied(false);
    onClose();
  }

  return (
    <SheetModal visible={visible} onClose={handleClose} header="MCP 토큰 발급">
      {!connectorUrl ? (
        <View>
          <Text style={[styles.label, { color: theme.textMuted }]}>라벨 (선택)</Text>
          <TextField variant="line" placeholder="예: 아이폰, 맥북" value={label} onChangeText={setLabel} />
          {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 8 }}>{error}</Text> : null}
          <View style={{ marginTop: 16 }}>
            <Button display="full" size="big" type="primary" loading={createToken.isPending} onPress={handleCreate}>
              발급하기
            </Button>
          </View>
        </View>
      ) : (
        <View>
          <Text style={[styles.label, { color: theme.textMuted }]}>커넥터 URL</Text>
          <View style={[styles.codeBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={{ color: theme.brand, fontSize: 13 }}>{connectorUrl}</Text>
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 10 }}>claude.ai → 설정 → 커넥터 → 커스텀 커넥터 추가에 이 URL을 붙여넣으세요.</Text>
          <View style={styles.btnRow}>
            <Pressable style={[styles.actionBtn, { backgroundColor: copied ? theme.brandSoft : theme.bg, borderColor: theme.border }]} onPress={handleCopy}>
              <Text style={{ color: copied ? theme.brand : theme.text, fontSize: 14, fontWeight: '700' }}>{copied ? '복사됨!' : 'URL 복사'}</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: theme.brand, borderColor: 'transparent' }]} onPress={handleClose}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>닫기</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  codeBox: { borderWidth: 1, borderRadius: 12, padding: 14 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
