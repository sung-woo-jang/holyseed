import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import TossEmoji from '../common/TossEmoji';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';

interface JoinSheetProps {
  visible: boolean;
  onClose: () => void;
  initialCode?: string;
}

const MOCK_PREVIEW = {
  ownerName: '김토스',
  householdName: '토스네 가족',
  memberCount: 2,
  assetCount: 8,
};

export default function JoinSheet({ visible, onClose, initialCode }: JoinSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState(initialCode ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setStep(2);
    }
  }, [initialCode]);

  function handlePreview() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 600);
  }

  function handleJoin() {
    setStep(3);
    setTimeout(() => {
      setStep(1);
      setCode('');
      onClose();
    }, 1200);
  }

  function handleClose() {
    setStep(1);
    setCode('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {Icon.close(theme.textMuted, 20)}
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>초대 코드로 합류</Text>
            <View style={{ width: 20 }} />
          </View>

          {step === 1 && (
            <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
              <Text style={[styles.desc, { color: theme.textMuted }]}>
                초대받은 코드를 입력하면 가구에 합류할 수 있어요
              </Text>
              <TextInput
                style={[styles.codeInput, { borderColor: theme.border, color: theme.brand, backgroundColor: theme.bg }]}
                placeholder="TOSS-XXXXXX"
                placeholderTextColor={theme.border}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: code.length >= 8 ? theme.brand : theme.border }]}
                onPress={handlePreview}
                disabled={code.length < 8 || loading}
              >
                <Text style={[styles.nextBtnText, { color: code.length >= 8 ? '#fff' : theme.textMuted }]}>
                  {loading ? '확인 중...' : '확인'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
              <Text style={[styles.desc, { color: theme.textMuted }]}>이 가구에 합류할까요?</Text>
              <View style={[styles.previewCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[styles.previewHousehold, { color: theme.text }]}>{MOCK_PREVIEW.householdName}</Text>
                <Text style={[styles.previewMeta, { color: theme.textMuted }]}>
                  {MOCK_PREVIEW.ownerName}님의 가구 · 멤버 {MOCK_PREVIEW.memberCount}명 · 자산 {MOCK_PREVIEW.assetCount}건
                </Text>
              </View>
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.brand }]} onPress={handleJoin}>
                <Text style={styles.nextBtnText}>합류하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.confirmBox}>
              <TossEmoji code={TE.party} size={80} />
              <Text style={[styles.confirmTitle, { color: theme.text }]}>합류 완료!</Text>
              <Text style={[styles.confirmSub, { color: theme.textMuted }]}>{MOCK_PREVIEW.householdName}에 합류했어요</Text>
            </View>
          )}
        </Pressable>
        </KeyboardAvoidingView>
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
  body: { padding: 20, gap: 14 },
  desc: { fontSize: 14, lineHeight: 20 },
  codeInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  nextBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  previewCard: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16 },
  previewHousehold: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  previewMeta: { fontSize: 13 },
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 24, fontWeight: '800' },
  confirmSub: { fontSize: 14 },
});
