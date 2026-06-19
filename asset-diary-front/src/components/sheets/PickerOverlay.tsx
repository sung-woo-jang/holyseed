import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';

interface PickerOverlayProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * 폼 시트(SheetModal) 내부에 띄우는 피커 오버레이.
 *
 * RN Modal은 네이티브 최상위 레이어라 Modal 안에 Modal을 중첩하면 안 보인다.
 * 그래서 피커는 별도 Modal이 아니라, 폼의 SheetModal 안(BottomSheet.Root 뒤
 * 형제)에 absolute 오버레이로 렌더한다. → SheetModal의 `overlay` prop으로 전달.
 */
export default function PickerOverlay({ visible, title, onClose, children }: PickerOverlayProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const dim = theme.dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.32)';

  return (
    <View style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: dim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.panel, { backgroundColor: theme.card }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 0, paddingRight: 20, paddingTop: 4, paddingBottom: insets.bottom + 32 }}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 1000, elevation: 24 },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    elevation: 25,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', paddingHorizontal: 20, paddingBottom: 16 },
});
