import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Button from '../ui/Button';
import ListRow from '../ui/ListRow';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { Icon } from '../common/Icon';
import { useInvite } from '../../queries/mutations';
import { getErrorMessage } from '../../lib/error';

type InviteRole = 'EDITOR' | 'VIEWER';

interface InviteSheetProps {
  visible: boolean;
  onClose: () => void;
}

const ROLE_INFO: Record<InviteRole, { label: string; desc: string }> = {
  EDITOR: { label: '편집자', desc: '자산·거래 입력 가능, 멤버 관리 불가' },
  VIEWER: { label: '조회자', desc: '조회만 가능, 입력·관리 불가' },
};

export default function InviteSheet({ visible, onClose }: InviteSheetProps) {
  const theme = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<InviteRole>('EDITOR');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const invite = useInvite();

  async function handleNext() {
    setError('');
    try {
      const result = await invite.mutateAsync(role);
      setCode(result.code);
      setStep(2);
    } catch (e: any) {
      setError(getErrorMessage(e, '초대 코드 생성에 실패했어요.'));
    }
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setStep(1);
    setCode('');
    setError('');
    onClose();
  }

  return (
    <SheetModal visible={visible} onClose={handleClose} header="멤버 초대">
      {step === 1 ? (
        <View>
          <Text style={[styles.stepLabel, { color: theme.textMuted }]}>권한 선택</Text>
          {(['EDITOR', 'VIEWER'] as InviteRole[]).map((r) => (
            <ListRow
              key={r}
              contents={
                <View>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{ROLE_INFO[r].label}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{ROLE_INFO[r].desc}</Text>
                </View>
              }
              right={role === r ? Icon.check(theme.brand, 18) : undefined}
              onPress={() => setRole(r)}
              verticalPadding="small"
            />
          ))}
          {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 8 }}>{error}</Text> : null}
          <View style={{ marginTop: 12 }}>
            <Button display="full" size="big" type="primary" loading={invite.isPending} onPress={handleNext}>
              초대 코드 생성
            </Button>
          </View>
        </View>
      ) : (
        <View>
          <Text style={[styles.stepLabel, { color: theme.textMuted }]}>초대 코드</Text>
          <View style={[styles.codeBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.codeText, { color: theme.brand }]}>{code}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>7일 후 만료</Text>
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 12 }}>{ROLE_INFO[role].label} 권한으로 초대합니다</Text>
          <View style={styles.btnRow}>
            <Pressable style={[styles.actionBtn, { backgroundColor: copied ? theme.brandSoft : theme.bg, borderColor: theme.border }]} onPress={handleCopy}>
              <Text style={{ color: copied ? theme.brand : theme.text, fontSize: 14, fontWeight: '700' }}>{copied ? '복사됨!' : '코드 복사'}</Text>
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
  stepLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  codeBox: { borderWidth: 1, borderRadius: 14, padding: 20, alignItems: 'center', marginTop: 4 },
  codeText: { fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  actionBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
