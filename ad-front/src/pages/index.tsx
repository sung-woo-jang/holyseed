import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar, { type TabKey } from '../components/TabBar';
import AssetsScreen from '../screens/AssetsScreen';
import BookScreen from '../screens/BookScreen';
import HomeScreen from '../screens/HomeScreen';
import MoreScreen from '../screens/MoreScreen';
import { useAuthStore } from '../stores/auth.store';
import type { MockAsset } from '../lib/mock-data';

export default function HomePage() {
  const navigate = useNavigate();
  const { currentHousehold, isReady } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  useEffect(() => {
    if (isReady && !currentHousehold) {
      navigate('/auth/onboarding');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, currentHousehold]);

  function handleAssetPress(asset: MockAsset) {
    navigate(`/assets/${asset.id}`);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100dvh' }}>
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'assets' && <AssetsScreen onAssetPress={handleAssetPress} />}
      {activeTab === 'book' && <BookScreen />}
      {activeTab === 'more' && <MoreScreen />}
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </div>
  );
}
