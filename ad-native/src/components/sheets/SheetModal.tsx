import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';

interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  header?: string;
  cta?: ReactNode;
  children: ReactNode;
  /** 시트 위에 겹쳐 그리는 오버레이(날짜 피커 등) */
  overlay?: ReactNode;
}

/**
 * @gorhom/bottom-sheet(BottomSheetModal)는 이 앱 환경에서 present()는 성공해도 실제 화면엔 전혀
 * 안 뜨는 근본 버그가 있어 제거했고, 뒤이어 시도한 slide 애니메이션(네이티브 animationType="slide",
 * 그리고 JS Animated로 직접 translateY 계산한 버전) 둘 다 화면 높이 계산이 기기/시트마다 어긋나
 * "다 올라오지 못하고 잘리는" 문제가 있었다. `fade`는 위치를 옮기지 않고 투명도만 바꾸므로
 * 이런 계산 오차가 생길 여지가 없다 — ConfirmDialog가 이미 같은 방식(fade + 중앙 정렬)으로
 * 문제 없이 동작해온 것과 동일한 패턴을, 하단 정렬로만 바꿔 적용.
 */
export default function SheetModal({ visible, onClose, header, cta, children, overlay }: SheetModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.scrim} onPress={onClose}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
            <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
              {header && (
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.headerText, { color: theme.text }]}>{header}</Text>
                </View>
              )}
              <ScrollView contentContainerStyle={[styles.body, !cta && { paddingBottom: 24 + insets.bottom }]} keyboardShouldPersistTaps="handled">
                {children}
              </ScrollView>
              {cta && (
                <View style={[styles.ctaWrap, { paddingBottom: 20 + insets.bottom, borderTopColor: theme.border, backgroundColor: theme.card }]}>
                  {cta}
                </View>
              )}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
      {overlay}
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerText: { fontSize: 17, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
});
