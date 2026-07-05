import { useState } from 'react';
import Button from '../ui/Button';
import ListRow from '../ui/ListRow';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { Icon } from '../common/Icon';
import { useInvite } from '../../queries/mutations';
import styles from './InviteSheet.module.css';

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
      setError(e?.message ?? '초대 코드 생성에 실패했어요.');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // 클립보드 권한 거부 등 — 코드가 화면에 보이므로 무시
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setStep(1); setCode(''); setError(''); onClose();
  }

  return (
    <SheetModal visible={visible} onClose={handleClose} header="멤버 초대">
      {step === 1 ? (
        <div className={styles.body}>
          <span className={styles.stepLabel} style={{ color: theme.textMuted }}>권한 선택</span>
          {(['EDITOR', 'VIEWER'] as InviteRole[]).map((r) => (
            <ListRow
              key={r}
              contents={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{ROLE_INFO[r].label}</span>
                  <span style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{ROLE_INFO[r].desc}</span>
                </div>
              }
              right={role === r ? Icon.check(theme.brand, 18) : undefined}
              onPress={() => setRole(r)}
              verticalPadding="small"
            />
          ))}
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button display="full" size="big" type="primary" loading={invite.isPending} onPress={handleNext}>
            초대 코드 생성
          </Button>
        </div>
      ) : (
        <div className={styles.body}>
          <span className={styles.stepLabel} style={{ color: theme.textMuted }}>초대 코드</span>
          <div className={styles.codeBox} style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <span className={styles.codeText} style={{ color: theme.brand }}>{code}</span>
            <span className={styles.expireText} style={{ color: theme.textMuted }}>7일 후 만료</span>
          </div>
          <span className={styles.roleInfo} style={{ color: theme.textMuted }}>
            {ROLE_INFO[role].label} 권한으로 초대합니다
          </span>
          <div className={styles.btnRow}>
            <button
              type="button"
              className={styles.actionBtn}
              style={{ backgroundColor: copied ? theme.brandSoft : theme.bg, borderColor: theme.border }}
              onClick={handleCopy}
            >
              <span className={styles.actionBtnText} style={{ color: copied ? theme.brand : theme.text }}>
                {copied ? '복사됨!' : '코드 복사'}
              </span>
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              style={{ backgroundColor: theme.brand, borderColor: 'transparent' }}
              onClick={handleClose}
            >
              <span className={styles.actionBtnText} style={{ color: '#fff' }}>닫기</span>
            </button>
          </div>
        </div>
      )}
    </SheetModal>
  );
}
