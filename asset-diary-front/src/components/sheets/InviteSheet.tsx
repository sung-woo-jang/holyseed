import React, { useState } from 'react';
import {
  Clipboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { Icon } from '../common/Icon';

type InviteRole = 'EDITOR' | 'VIEWER';

interface InviteSheetProps {
  visible: boolean;
  onClose: () => void;
}

const ROLE_INFO: Record<InviteRole, { label: string; desc: string }> = {
  EDITOR: { label: '편집자', desc: '자산·거래 입력 가능, 멤버 관리 불가' },
  VIEWER: { label: '조회자', desc: '조회만 가능, 입력·관리 불가' },
};

function generateCode() {
  return 'TOSS-' + Math.random().toString(36).toUpperCase().slice(2, 8);
}

export default function InviteSheet({ visible, onClose }: InviteSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<InviteRole>('EDITOR');
  const [code] = useState(() => generateCode());
  const [copied, setCopied] = useState(false);

  function handleNext() {
    setStep(2);
  }

  function handleCopy() {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setStep(1);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {Icon.close(theme.textMuted, 20)}
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>멤버 초대</Text>
            <View style={{ width: 20 }} />
          </View>

          {step === 1 ? (
            <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
              <Text style={[styles.stepLabel, { color: theme.textMuted }]}>권한 선택</Text>
              {(['EDITOR', 'VIEWER'] as InviteRole[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleCard,
                    { borderColor: role === r ? theme.brand : theme.border, backgroundColor: role === r ? theme.brandSoft : theme.bg },
                  ]}
                  onPress={() => setRole(r)}
                >
                  <View style={styles.roleMain}>
                    <Text style={[styles.roleLabel, { color: role === r ? theme.brand : theme.text }]}>
                      {ROLE_INFO[r].label}
                    </Text>
                    <Text style={[styles.roleDesc, { color: theme.textMuted }]}>{ROLE_INFO[r].desc}</Text>
                  </View>
                  {role === r && Icon.check(theme.brand, 18)}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.brand }]} onPress={handleNext}>
                <Text style={styles.nextBtnText}>초대 코드 생성</Text>
              </TouchableOpacity>
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
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>토스로 보내기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { padding: 20, gap: 12, paddingBottom: 20 },
  stepLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  roleCard: { borderWidth: 2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  roleMain: { flex: 1 },
  roleLabel: { fontSize: 15, fontWeight: '700' },
  roleDesc: { fontSize: 12, marginTop: 3 },
  nextBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  codeBox: { borderWidth: 1, borderRadius: 16, paddingVertical: 24, alignItems: 'center' },
  codeText: { fontSize: 26, fontWeight: '800', letterSpacing: 3 },
  expireText: { fontSize: 12, marginTop: 8 },
  roleInfo: { textAlign: 'center', fontSize: 13 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});
