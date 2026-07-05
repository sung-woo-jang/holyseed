import type { ReactNode } from 'react';
import Sheet from '../ui/Sheet';

interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  header?: string;
  cta?: ReactNode;
  children: ReactNode;
  /** 시트 위에 겹쳐 그리는 오버레이(피커 등) */
  overlay?: ReactNode;
}

export default function SheetModal({ visible, onClose, header, cta, children, overlay }: SheetModalProps) {
  return (
    <Sheet visible={visible} onClose={onClose} header={header} cta={cta} overlay={overlay}>
      {children}
    </Sheet>
  );
}
