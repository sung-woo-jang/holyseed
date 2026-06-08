import React, { useState } from 'react';
import {
  Clipboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, Button, ListRow } from '@toss/tds-react-native';
import { useTheme } from '../../lib/theme';
import { Icon } from '../common/Icon';
import { useInvite } from '../../queries/mutations';

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
  const insets = useSafeAreaInsets();
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
      setError(e?.message ?? '초대 코드 생성에 실패했어요.');
    }
  }

  function handleCopy() {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setStep(1); setCode(''); setError(''); onClose();
  }

  return (
    <BottomSheet.Root
      open={visible}
      onClose={handleClose}
      header={<BottomSheet.Header>멤버 초대</BottomSheet.Header>}
    >
      {step === 1 ? (
        <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.stepLabel, { color: theme.textMuted }]}>권한 선택</Text>
          {(['EDITOR', 'VIEWER'] as InviteRole[]).map((r) => (
            <ListRow
              key={r}
              contents={ROLE_INFO[r].label}
              right={role === r ? Icon.check(theme.brand, 18) : undefined}
              onPress={() => setRole(r)}
              verticalPadding="small"
            />
          ))}
          {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" loading={invite.isPending} onPress={handleNext}>
            초대 코드 생성
          </Button>
        </View>
      ) : (
        <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.stepLabel, { color: theme.textMuted }]}>초대 코드</Text>
          <View style={[styles.codeBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.codeText, { color: theme.brand }]}>{code}</Text>
            <Text style={[styles.expireText, { color: theme.textMuted }]}>7일 후 만료</Text>
          </View>
          <Text style={[styles.roleInfo, { color: theme.textMuted }]}>
            {ROLE_INFO[role].label} 권한으로 초대합니다
          </Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: copied ? theme.brandSoft : theme.bg, borderColor: theme.border }]}
              onPress={handleCopy}
            >
              <Text style={[styles.actionBtnText, { color: copied ? theme.brand : theme.text }]}>
                {copied ? '복사됨!' : '코드 복사'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.brand }]} onPress={handleClose}>
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </BottomSheet.Root>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  stepLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  codeBox: { borderWidth: 1, borderRadius: 16, paddingVertical: 24, alignItems: 'center' },
  codeText: { fontSize: 26, fontWeight: '800', letterSpacing: 3 },
  expireText: { fontSize: 12, marginTop: 8 },
  roleInfo: { textAlign: 'center', fontSize: 13 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  errorText: { fontSize: 13, textAlign: 'center' },
});
