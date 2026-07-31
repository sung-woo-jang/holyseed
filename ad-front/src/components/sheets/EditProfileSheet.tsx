import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { useUpdateProfile } from '../../queries/mutations';
import { getErrorMessage } from '../../lib/error';
import { Icon } from '../common/Icon';
import styles from './EditProfileSheet.module.css';

const AVATAR_COLORS = ['#3182F6', '#FF6D35', '#34C759', '#FF3B30', '#AF52DE', '#FF9500'];

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditProfileSheet({ visible, onClose, onSaved }: EditProfileSheetProps) {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState('');
  const updateProfile = useUpdateProfile();

  // 열릴 때 현재 프로필로 프리필
  useEffect(() => {
    if (visible && user) {
      setName(user.name);
      setColor(user.avatarColor);
      setError('');
    }
  }, [visible, user]);

  const isValid = name.trim().length > 0;

  async function handleSave() {
    setError('');
    try {
      await updateProfile.mutateAsync({ name: name.trim(), avatarColor: color });
      onClose();
      onSaved?.();
    } catch (e: any) {
      setError(getErrorMessage(e, '프로필 저장에 실패했어요.'));
    }
  }

  return (
    <SheetModal visible={visible} onClose={onClose} header="내 프로필 수정">
      <div className={styles.body}>
        <div className={styles.previewWrap}>
          <div className={styles.previewAvatar} style={{ backgroundColor: color }}>
            <span className={styles.previewText}>{(name || user?.name || '').charAt(0)}</span>
          </div>
        </div>

        <TextField
          variant="line"
          label="이름"
          placeholder="이름"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />

        <div>
          <span className={styles.colorLabel} style={{ color: theme.textMuted }}>아바타 색상</span>
          <div className={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={styles.colorSwatch}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              >
                {color === c && Icon.check('#fff', 16)}
              </button>
            ))}
          </div>
        </div>

        {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}

        <Button
          display="full"
          size="big"
          type="primary"
          disabled={!isValid}
          loading={updateProfile.isPending}
          onPress={handleSave}
        >
          저장하기
        </Button>
      </div>
    </SheetModal>
  );
}
