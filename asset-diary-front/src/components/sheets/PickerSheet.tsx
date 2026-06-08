import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@toss/tds-react-native';

interface PickerSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function PickerSheet({ visible, title, onClose, children }: PickerSheetProps) {
  return (
    <BottomSheet.Root
      open={visible}
      onClose={onClose}
      header={<BottomSheet.Header>{title}</BottomSheet.Header>}
    >
      <View style={styles.body}>{children}</View>
    </BottomSheet.Root>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 24 },
});
