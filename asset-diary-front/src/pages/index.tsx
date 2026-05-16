import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar, { type TabKey } from '../components/TabBar';
import AssetsScreen from '../screens/AssetsScreen';
import BookScreen from '../screens/BookScreen';
import HomeScreen from '../screens/HomeScreen';
import MoreScreen from '../screens/MoreScreen';
import { useAuthStore } from '../stores/auth.store';
import type { MockAsset } from '../lib/mock-data';

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

  function handleAssetPress(asset: MockAsset) {
    navigation.navigate('/assets/detail', { id: asset.id });
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'assets' && <AssetsScreen onAssetPress={handleAssetPress} />}
      {activeTab === 'book' && <BookScreen />}
      {activeTab === 'more' && <MoreScreen navigation={navigation} />}
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
