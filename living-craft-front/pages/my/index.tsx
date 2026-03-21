import { Card } from '@components/ui';
import { MENU_ITEMS } from '@constants';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { useBottomNavHeight, useLogout, useMe } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Asset, Button, Skeleton } from '@toss/tds-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Route = createRoute('/my', {
  component: Page,
});

function Page() {
  const navigation = useNavigation();
  const bottomNavHeight = useBottomNavHeight();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: user, isLoading } = useMe();

  /**
   * 로그아웃 처리
   */
  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        // 로그인 페이지로 리다이렉트
        navigation.navigate('/unauthorized' as any);
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight, paddingTop: 10 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 프로필 섹션 Skeleton */}
          <Card>
            <View style={styles.profileContent}>
              <Skeleton width={80} height={80} borderRadius={40} />
              <View style={{ height: 16 }} />
              <Skeleton width={100} height={22} borderRadius={4} />
              <View style={{ height: 6 }} />
              <Skeleton width={160} height={14} borderRadius={4} />
            </View>
          </Card>

          {/* 메뉴 리스트 Skeleton */}
          <Card>
            {Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Skeleton width={24} height={24} borderRadius={4} />
                  <View style={styles.menuText}>
                    <Skeleton width="50%" height={16} borderRadius={4} />
                    <View style={{ height: 4 }} />
                    <Skeleton width="70%" height={13} borderRadius={4} />
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>로그인이 필요합니다.</Text>
          <Button type="primary" style="weak" onPress={() => navigation.navigate('/unauthorized' as any)}>
            로그인하기
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight, paddingTop: 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 섹션 */}
        <Card>
          <View style={styles.profileContent}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{user.name[0]}</Text>
            </View>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </Card>

        {/* 메뉴 리스트 */}
        <Card>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={() => navigation.navigate(item.path as any)}>
              <View style={styles.menuItemLeft}>
                <Asset.Icon name={item.iconName} frameShape={Asset.frameShape.CleanW24} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Text style={styles.menuArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* 로그아웃 버튼 */}
        <View style={styles.logoutSection}>
          <Button type="light" style="weak" display="full" onPress={handleLogout} disabled={isLoggingOut}>
            <Text style={styles.logoutButtonText}>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingVertical: 10,
    // 하단 여백은 PublicLayout에서 자동 처리
  },
  profileContent: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.grey900,
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.grey600,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  menuItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.grey600,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.red500,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuArrow: {
    fontSize: 24,
    color: colors.grey400,
  },
  logoutSection: {
    padding: 20,
    paddingTop: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey700,
  },
  appInfo: {
    padding: 20,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 12,
    color: colors.grey500,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.grey600,
  },
});
