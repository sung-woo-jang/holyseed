import { colors } from '@toss/tds-colors';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface FilterOption {
  key: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  activeKey: string;
  onFilterChange: (key: string) => void;
}

/**
 * 필터 탭 컴포넌트
 * 여러 페이지에서 재사용 가능한 필터 탭 UI
 */
export const FilterTabs = ({ options, activeKey, onFilterChange }: FilterTabsProps) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {options.map((option) => {
          const isActive = option.key === activeKey;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onFilterChange(option.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.grey100,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: colors.blue500,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey700,
  },
  tabTextActive: {
    color: 'white',
  },
});
