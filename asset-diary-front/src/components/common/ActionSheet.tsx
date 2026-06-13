import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ListRow } from '@toss/tds-react-native';
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

/**
 * 행 액션 메뉴 — SheetModal + ListRow 목록.
 * TDS BottomSheet.Select는 체크박스 라디오 UI라 액션 메뉴엔 부적합하여
 * ListRow(아이콘 + 라벨) 목록으로 직접 구성한다.
 */
export default function ActionSheet({ visible, title, items, onSelect, onClose }: ActionSheetProps) {
  const theme = useTheme();
  return (
    <SheetModal visible={visible} onClose={onClose} header={title}>
      <View style={styles.body}>
        {items.map((item) => (
          <ListRow
            key={item.value}
            left={<TossEmoji code={item.iconCode} size={20} />}
            contents={
              <Text style={[styles.label, { color: item.danger ? theme.danger : theme.text }]}>
                {item.label}
              </Text>
            }
            onPress={() => onSelect(item.value)}
            verticalPadding="small"
          />
        ))}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 12 },
  label: { fontSize: 15, fontWeight: '600' },
});
