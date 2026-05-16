import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './common/Icon';

export type TabKey = 'home' | 'assets' | 'book' | 'more';

const COLOR_ACTIVE = '#3182F6';
const COLOR_INACTIVE = '#B0B8C1';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'assets', label: '자산' },
  { key: 'book', label: '거래장부' },
  { key: 'more', label: '더보기' },
];

function TabIcon({ tabKey, color }: { tabKey: TabKey; color: string }) {
  switch (tabKey) {
    case 'home': return Icon.home(color, 24);
    case 'assets': return Icon.wallet(color, 24);
    case 'book': return Icon.book(color, 24);
    case 'more': return Icon.more(color, 24);
  }
}

interface TabBarProps {
  activeTab: TabKey;
  onTabPress: (key: TabKey) => void;
}

export default function TabBar({ activeTab, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const color = isActive ? COLOR_ACTIVE : COLOR_INACTIVE;
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
            <TabIcon tabKey={tab.key} color={color} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E8EB',
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    color: COLOR_INACTIVE,
    fontWeight: '500',
  },
  labelActive: {
    color: COLOR_ACTIVE,
    fontWeight: '700',
  },
});
