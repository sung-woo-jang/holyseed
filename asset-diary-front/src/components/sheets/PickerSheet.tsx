import React from 'react';
import { StyleSheet, View } from 'react-native';
import SheetModal from './SheetModal';

interface PickerSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function PickerSheet({ visible, title, onClose, children }: PickerSheetProps) {
  return (
    <SheetModal visible={visible} onClose={onClose} header={title}>
      <View style={styles.body}>{children}</View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 24 },
});
