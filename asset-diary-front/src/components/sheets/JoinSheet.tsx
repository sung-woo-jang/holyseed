import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, TextField } from '@toss/tds-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import TossEmoji from '../common/TossEmoji';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';
import { qk } from '../../queries/keys';

interface JoinSheetProps {
  visible: boolean;
  onClose: () => void;
  initialCode?: string;
}

export default function JoinSheet({ visible, onClose, initialCode }: JoinSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { setHouseholds, currentHousehold } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState(initialCode ?? '');
  const [preview, setPreview] = useState<{ householdName: string; role: string; memberCount?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      handlePreview(initialCode);
    }
  }, [initialCode]);

  async function handlePreview(inviteCode?: string) {
    const c = inviteCode ?? code;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/invitations/${c}/preview`);
      setPreview(data.data ?? data);
      setStep(2);
    } catch (e: any) {
      setError('유효하지 않은 초대 코드예요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError('');
    setJoining(true);
    try {
      await api.post(`/invitations/${code}/accept`);
      const { data } = await api.get('/households');
      setHouseholds(data.data ?? data);
      // 멤버/초대 쿼리 갱신
      if (currentHousehold?.id) {
        qc.invalidateQueries({ queryKey: qk.members(currentHousehold.id) });
        qc.invalidateQueries({ queryKey: qk.invitations(currentHousehold.id) });
      }
      setStep(3);
      setTimeout(() => {
        setStep(1);
        setCode('');
        setPreview(null);
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(e?.message ?? '합류에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setJoining(false);
    }
  }

  function handleClose() {
    setStep(1);
    setCode('');
    setPreview(null);
    setError('');
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
              <TextField
                variant="box"
                placeholder="TOSS-XXXXXX"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <Button
                display="full"
                size="big"
                type="primary"
                disabled={code.length < 8}
                loading={loading}
                onPress={() => handlePreview()}
              >
                확인
              </Button>
            </View>
          )}

          {step === 2 && preview && (
            <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
              <Text style={[styles.desc, { color: theme.textMuted }]}>이 가구에 합류할까요?</Text>
              <View style={[styles.previewCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[styles.previewHousehold, { color: theme.text }]}>{preview.householdName}</Text>
                <Text style={[styles.previewMeta, { color: theme.textMuted }]}>
                  {preview.role} 권한으로 참여{preview.memberCount ? ` · 멤버 ${preview.memberCount}명` : ''}
                </Text>
              </View>
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <Button
                display="full"
                size="big"
                type="primary"
                loading={joining}
                onPress={handleJoin}
              >
                합류하기
              </Button>
            </View>
          )}

          {step === 3 && (
            <View style={styles.confirmBox}>
              <TossEmoji code={TE.party} size={80} />
              <Text style={[styles.confirmTitle, { color: theme.text }]}>합류 완료!</Text>
              <Text style={[styles.confirmSub, { color: theme.textMuted }]}>{preview?.householdName ?? '가구'}에 합류했어요</Text>
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
  errorText: { fontSize: 13, textAlign: 'center' },
});
