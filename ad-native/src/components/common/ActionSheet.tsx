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
  /** 헤더와 목록 사이 위쪽 여백(기본 14) — 짧은 목록에서 0으로 줄일 때 사용 */
  bodyPaddingTop?: number;
  /** 목록 좌우 여백(기본 20) — 행을 화면 끝까지 붙이고 싶을 때 0으로 줄일 때 사용 */
  bodyPaddingHorizontal?: number;
}

/** 행 액션 메뉴 — SheetModal + ListRow 목록 */
export default function ActionSheet({ visible, title, items, onSelect, onClose, bodyPaddingTop, bodyPaddingHorizontal }: ActionSheetProps) {
  const theme = useTheme();
  return (
    <SheetModal visible={visible} onClose={onClose} header={title} bodyPaddingTop={bodyPaddingTop} bodyPaddingHorizontal={bodyPaddingHorizontal}>
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
