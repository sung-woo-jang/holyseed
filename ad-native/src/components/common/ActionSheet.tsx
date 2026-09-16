import { Text, View } from 'react-native';
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
      <View>
        {items.map((item) => (
          <ListRow
            key={item.value}
            left={<TossEmoji code={item.iconCode} size={22} />}
            contents={<Text style={{ fontSize: 15, fontWeight: '600', color: item.danger ? theme.danger : theme.text }}>{item.label}</Text>}
            onPress={() => onSelect(item.value)}
            verticalPadding="medium"
          />
        ))}
      </View>
    </SheetModal>
  );
}
