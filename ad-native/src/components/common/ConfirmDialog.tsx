import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Loader from '../ui/Loader';
import { useTheme } from '../../lib/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.dialog, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {description && <Text style={[styles.desc, { color: theme.textMuted }]}>{description}</Text>}
          <View style={styles.buttons}>
            <Pressable style={[styles.btn, { backgroundColor: theme.bg }]} onPress={onClose}>
              <Text style={[styles.btnText, { color: theme.text }]}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: danger ? theme.danger : theme.brand, opacity: loading ? 0.7 : 1 }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? <Loader color="#fff" /> : <Text style={[styles.btnText, { color: '#fff' }]}>{confirmText}</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  dialog: { width: '100%', maxWidth: 340, borderRadius: 18, padding: 22, gap: 6 },
  title: { fontSize: 17, fontWeight: '700' },
  desc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
});
