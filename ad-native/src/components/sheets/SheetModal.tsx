import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
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

export default function SheetModal({ visible, onClose, header, cta, children, overlay }: SheetModalProps) {
  const theme = useTheme();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  return (
    <>
      <BottomSheetModal
        ref={ref}
        snapPoints={['85%']}
        onDismiss={onClose}
        backgroundStyle={{ backgroundColor: theme.card }}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
      >
        {header && (
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerText, { color: theme.text }]}>{header}</Text>
          </View>
        )}
        {/* BottomSheetScrollView는 New Architecture 환경에서 present()는 성공해도 실제로는
            안 뜨는 알려진 버그가 있어(gorhom/react-native-bottom-sheet #2035) BottomSheetView +
            일반 ScrollView 조합으로 우회 */}
        <BottomSheetView style={styles.sheetView}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </BottomSheetView>
        {cta && <View style={[styles.ctaWrap, { borderTopColor: theme.border, backgroundColor: theme.card }]}>{cta}</View>}
      </BottomSheetModal>
      {overlay}
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerText: { fontSize: 17, fontWeight: '700' },
  sheetView: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
});
