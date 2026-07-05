import { Icon } from './common/Icon';
import styles from './TabBar.module.css';
import cn from 'classnames';

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
  return (
    <div className={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const color = isActive ? COLOR_ACTIVE : COLOR_INACTIVE;
        return (
          <button
            type="button"
            key={tab.key}
            className={styles.tab}
            onClick={() => onTabPress(tab.key)}
          >
            <TabIcon tabKey={tab.key} color={color} />
            <span className={cn(styles.label, isActive && styles.labelActive)}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
