import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
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
        <BottomSheetScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {children}
        </BottomSheetScrollView>
        {cta && <View style={[styles.ctaWrap, { borderTopColor: theme.border, backgroundColor: theme.card }]}>{cta}</View>}
      </BottomSheetModal>
      {overlay}
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerText: { fontSize: 17, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
});
