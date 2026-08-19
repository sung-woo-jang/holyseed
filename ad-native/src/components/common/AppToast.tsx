import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AppToastProps {
  open: boolean;
  text: string;
  onClose: () => void;
}

export default function AppToast({ open, text, onClose }: AppToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.toast}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center', zIndex: 50 },
  toast: { backgroundColor: 'rgba(25,31,40,0.92)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
