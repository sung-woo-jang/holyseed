import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type TabKey = 'home' | 'assets' | 'book' | 'more';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { key: 'home', label: '홈', icon: '🏠' },
  { key: 'assets', label: '자산', icon: '💰' },
  { key: 'book', label: '거래장', icon: '📒' },
  { key: 'more', label: '더보기', icon: '⋯' },
];

interface TabBarProps {
  activeTab: TabKey;
  onTabPress: (key: TabKey) => void;
}

export default function TabBar({ activeTab, onTabPress }: TabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
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
    height: 56,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E8EB',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 20,
    opacity: 0.4,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    color: '#B0B8C1',
    fontWeight: '500',
  },
  labelActive: {
    color: '#3182F6',
    fontWeight: '700',
  },
});
