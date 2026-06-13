import React from 'react';
import { Modal, View } from 'react-native';
import { Toast } from '@toss/tds-react-native';

interface AppToastProps {
  open: boolean;
  text: string;
  onClose: () => void;
}

/**
 * TDS Toast 래퍼. Toast는 position:absolute라 부모를 채우므로 Modal로 감싼다.
 * Modal/래퍼 View는 pointerEvents="box-none"으로 터치를 통과시켜
 * 토스트가 화면 조작을 막지 않게 한다.
 */
export default function AppToast({ open, text, onClose }: AppToastProps) {
  if (!open) return null;
  return (
    <Modal visible={open} transparent animationType="none">
      <View style={{ flex: 1 }} pointerEvents="box-none">
        <Toast open={open} text={text} onClose={onClose} />
      </View>
    </Modal>
  );
}
