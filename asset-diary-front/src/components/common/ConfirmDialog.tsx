import React from 'react';
import { Modal, View } from 'react-native';
import { ConfirmDialog as TDSConfirmDialog } from '@toss/tds-react-native';

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

/**
 * TDS ConfirmDialog 래퍼.
 * Dialog는 position:absolute로 부모를 채우므로, BottomSheet와 동일하게
 * RN Modal로 감싸 화면 전체 portal에 렌더한다.
 */
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
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <TDSConfirmDialog
          open={visible}
          title={title}
          description={description}
          closeOnDimmerClick
          onClose={onClose}
          onExited={() => {}}
          leftButton={
            <TDSConfirmDialog.Button type="dark" style="weak" onPress={onClose}>
              {cancelText}
            </TDSConfirmDialog.Button>
          }
          rightButton={
            <TDSConfirmDialog.Button
              type={danger ? 'danger' : 'primary'}
              loading={loading}
              onPress={onConfirm}
            >
              {confirmText}
            </TDSConfirmDialog.Button>
          }
        />
      </View>
    </Modal>
  );
}
