import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { useUpdateProfile } from '../../queries/mutations';
import { getErrorMessage } from '../../lib/error';
import { Icon } from '../common/Icon';

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
  const [color, setColor] = useState(AVATAR_COLORS[0]!);
  const [error, setError] = useState('');
  const updateProfile = useUpdateProfile();

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
      <View style={styles.previewWrap}>
        <View style={[styles.previewAvatar, { backgroundColor: color }]}>
          <Text style={styles.previewText}>{(name || user?.name || '').charAt(0)}</Text>
        </View>
      </View>

      <TextField variant="line" label="이름" placeholder="이름" value={name} onChangeText={setName} maxLength={100} />

      <Text style={[styles.colorLabel, { color: theme.textMuted }]}>아바타 색상</Text>
      <View style={styles.colorRow}>
        {AVATAR_COLORS.map((c) => (
          <Pressable key={c} style={[styles.colorSwatch, { backgroundColor: c }]} onPress={() => setColor(c)}>
            {color === c && Icon.check('#fff', 16)}
          </Pressable>
        ))}
      </View>

      {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 12 }}>{error}</Text> : null}

      <Button display="full" size="big" type="primary" disabled={!isValid} loading={updateProfile.isPending} onPress={handleSave}>
        저장하기
      </Button>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  previewWrap: { alignItems: 'center', marginBottom: 20 },
  previewAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  previewText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  colorLabel: { fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
