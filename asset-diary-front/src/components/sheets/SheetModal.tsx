import React from 'react';
import { Modal, View } from 'react-native';
import { BottomSheet } from '@toss/tds-react-native';

interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  header?: string;
  cta?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * TDS BottomSheet.Root는 OverlayProvider portal로 띄우는 게 정석이지만
 * useOverlay가 패키지 public export에 없어 직접 호출이 불가능해요.
 *
 * 대신 RN Modal로 감싸면 Modal이 항상 화면 전체에 portal 렌더되므로,
 * 그 안의 BottomSheet.Root(position:absolute)가 화면 전체를 정확히 기준으로 잡아요.
 * Modal의 transparent 배경 위에 BottomSheet의 딤/시트가 올라와요.
 */
export default function SheetModal({ visible, onClose, header, cta, children }: SheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <BottomSheet.Root
          open={visible}
          onClose={onClose}
          header={header ? <BottomSheet.Header>{header}</BottomSheet.Header> : undefined}
          cta={cta}
        >
          {children}
        </BottomSheet.Root>
      </View>
    </Modal>
  );
}
