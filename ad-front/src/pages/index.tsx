import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TabBar, { type TabKey } from '../components/TabBar';
import AssetsScreen from '../screens/AssetsScreen';
import BookScreen from '../screens/BookScreen';
import HomeScreen from '../screens/HomeScreen';
import MoreScreen from '../screens/MoreScreen';
import { useAuthStore } from '../stores/auth.store';
import type { MockAsset } from '../lib/mock-data';

const TAB_KEYS: TabKey[] = ['home', 'assets', 'book', 'more'];

export default function HomePage() {
  const navigate = useNavigate();
  const { currentHousehold, isReady } = useAuthStore();
  // 탭을 URL(?tab=)과 동기화 — 상세 갔다 뒤로 와도 탭 유지
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const activeTab: TabKey = tabParam && TAB_KEYS.includes(tabParam) ? tabParam : 'home';

  function setActiveTab(tab: TabKey) {
    setSearchParams(tab === 'home' ? {} : { tab }, { replace: true });
  }

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
      {activeTab === 'home' && <HomeScreen onSeeAllTx={() => setActiveTab('book')} />}
      {activeTab === 'assets' && <AssetsScreen onAssetPress={handleAssetPress} />}
      {activeTab === 'book' && <BookScreen />}
      {activeTab === 'more' && <MoreScreen />}
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </div>
  );
}
