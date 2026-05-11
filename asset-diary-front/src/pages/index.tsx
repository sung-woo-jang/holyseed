import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import TabBar, { type TabKey } from '../components/TabBar';
import { useAuthStore } from '../stores/auth.store';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const { currentHousehold, isReady } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  useEffect(() => {
    if (isReady && !currentHousehold) {
      navigation.navigate('/auth/onboarding');
    }
  }, [isReady, currentHousehold]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>{renderTab(activeTab)}</View>
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

function renderTab(tab: TabKey) {
  switch (tab) {
    case 'home':
      return <HomeScreen />;
    case 'assets':
      return <AssetsScreen />;
    case 'book':
      return <BookScreen />;
    case 'more':
      return <MoreScreen />;
  }
}

function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>자산일기</Text>
      <Text style={styles.sub}>순자산 대시보드</Text>
    </View>
  );
}

function AssetsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>자산</Text>
      <Text style={styles.sub}>자산 목록</Text>
    </View>
  );
}

function BookScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>거래장</Text>
      <Text style={styles.sub}>거래 내역</Text>
    </View>
  );
}

function MoreScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>더보기</Text>
      <Text style={styles.sub}>설정 및 관리</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191F28',
  },
  sub: {
    fontSize: 14,
    color: '#8B95A1',
  },
});
