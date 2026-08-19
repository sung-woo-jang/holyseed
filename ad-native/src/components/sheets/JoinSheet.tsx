import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import TossEmoji from '../common/TossEmoji';
import { TE } from '../../lib/toss-emoji';
import { qk } from '../../queries/keys';
import { getErrorMessage } from '../../lib/error';

interface JoinSheetProps {
  visible: boolean;
  onClose: () => void;
  initialCode?: string;
}

export default function JoinSheet({ visible, onClose, initialCode }: JoinSheetProps) {
  const theme = useTheme();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function handlePreview(inviteCode?: string) {
    const c = inviteCode ?? code;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/invitations/${c}/preview`);
      setPreview(data.data ?? data);
      setStep(2);
    } catch {
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
      setError(getErrorMessage(e, '합류에 실패했어요. 다시 시도해 주세요.'));
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
    <SheetModal visible={visible} onClose={handleClose} header="초대 코드로 합류">
      {step === 1 && (
        <View>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>초대받은 코드를 입력하면 가구에 합류할 수 있어요</Text>
          <TextField variant="line" placeholder="TOSS-XXXXXX" value={code} onChangeText={setCode} />
          {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 8 }}>{error}</Text> : null}
          <View style={{ marginTop: 16 }}>
            <Button display="full" size="big" type="primary" disabled={code.length < 8} loading={loading} onPress={() => handlePreview()}>
              확인
            </Button>
          </View>
        </View>
      )}
      {step === 2 && preview && (
        <View>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 12 }}>이 가구에 합류할까요?</Text>
          <View style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 14, padding: 18, alignItems: 'center' }}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700' }}>{preview.householdName}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
              {preview.role} 권한으로 참여{preview.memberCount ? ` · 멤버 ${preview.memberCount}명` : ''}
            </Text>
          </View>
          {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 8 }}>{error}</Text> : null}
          <View style={{ marginTop: 16 }}>
            <Button display="full" size="big" type="primary" loading={joining} onPress={handleJoin}>
              합류하기
            </Button>
          </View>
        </View>
      )}
      {step === 3 && (
        <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
          <TossEmoji code={TE.party} size={80} />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>합류 완료!</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>{preview?.householdName ?? '가구'}에 합류했어요</Text>
        </View>
      )}
    </SheetModal>
  );
}
