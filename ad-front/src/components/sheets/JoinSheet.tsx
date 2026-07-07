import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import styles from './JoinSheet.module.css';

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
    if (initialCode) { setCode(initialCode); handlePreview(initialCode); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function handlePreview(inviteCode?: string) {
    const c = inviteCode ?? code;
    setError(''); setLoading(true);
    try {
      const { data } = await api.post(`/invitations/${c}/preview`);
      setPreview(data.data ?? data);
      setStep(2);
    } catch {
      setError('유효하지 않은 초대 코드예요.');
    } finally { setLoading(false); }
  }

  async function handleJoin() {
    setError(''); setJoining(true);
    try {
      await api.post(`/invitations/${code}/accept`);
      const { data } = await api.get('/households');
      setHouseholds(data.data ?? data);
      if (currentHousehold?.id) {
        qc.invalidateQueries({ queryKey: qk.members(currentHousehold.id) });
        qc.invalidateQueries({ queryKey: qk.invitations(currentHousehold.id) });
      }
      setStep(3);
      setTimeout(() => { setStep(1); setCode(''); setPreview(null); onClose(); }, 1200);
    } catch (e: any) {
      setError(getErrorMessage(e, '합류에 실패했어요. 다시 시도해 주세요.'));
    } finally { setJoining(false); }
  }

  function handleClose() { setStep(1); setCode(''); setPreview(null); setError(''); onClose(); }

  return (
    <SheetModal visible={visible} onClose={handleClose} header="초대 코드로 합류">
      {step === 1 && (
        <div className={styles.body}>
          <span className={styles.desc} style={{ color: theme.textMuted }}>
            초대받은 코드를 입력하면 가구에 합류할 수 있어요
          </span>
          <TextField
            variant="line"
            placeholder="TOSS-XXXXXX"
            value={code}
            onChangeText={setCode}
          />
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button display="full" size="big" type="primary" disabled={code.length < 8} loading={loading} onPress={() => handlePreview()}>
            확인
          </Button>
        </div>
      )}
      {step === 2 && preview && (
        <div className={styles.body}>
          <span className={styles.desc} style={{ color: theme.textMuted }}>이 가구에 합류할까요?</span>
          <div className={styles.previewCard} style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <span className={styles.previewHousehold} style={{ color: theme.text }}>{preview.householdName}</span>
            <span className={styles.previewMeta} style={{ color: theme.textMuted }}>
              {preview.role} 권한으로 참여{preview.memberCount ? ` · 멤버 ${preview.memberCount}명` : ''}
            </span>
          </div>
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button display="full" size="big" type="primary" loading={joining} onPress={handleJoin}>
            합류하기
          </Button>
        </div>
      )}
      {step === 3 && (
        <div className={styles.confirmBox}>
          <TossEmoji code={TE.party} size={80} />
          <span className={styles.confirmTitle} style={{ color: theme.text }}>합류 완료!</span>
          <span className={styles.confirmSub} style={{ color: theme.textMuted }}>{preview?.householdName ?? '가구'}에 합류했어요</span>
        </div>
      )}
    </SheetModal>
  );
}
