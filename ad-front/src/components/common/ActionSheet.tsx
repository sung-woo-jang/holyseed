import ListRow from '../ui/ListRow';
import SheetModal from '../sheets/SheetModal';
import TossEmoji from './TossEmoji';
import { useTheme } from '../../lib/theme';

export interface ActionItem {
  iconCode: string;
  label: string;
  value: string;
  danger?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  items: ActionItem[];
  onSelect: (value: string) => void;
  onClose: () => void;
}

/** 행 액션 메뉴 — SheetModal + ListRow 목록 */
export default function ActionSheet({ visible, title, items, onSelect, onClose }: ActionSheetProps) {
  const theme = useTheme();
  return (
    <SheetModal visible={visible} onClose={onClose} header={title}>
      <div style={{ padding: '4px 10px 20px', display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => (
          <ListRow
            key={item.value}
            left={
              <div style={{ marginRight: 0 }}>
                <TossEmoji code={item.iconCode} size={22} />
              </div>
            }
            contents={
              <span style={{ fontSize: 15, fontWeight: 600, color: item.danger ? theme.danger : theme.text }}>
                {item.label}
              </span>
            }
            onPress={() => onSelect(item.value)}
            verticalPadding="medium"
          />
        ))}
      </div>
    </SheetModal>
  );
}
