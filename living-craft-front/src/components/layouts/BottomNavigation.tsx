import { BOTTOM_NAV_ITEMS, ROUTE_TAB_CONFIG } from '@constants';
import { createRoute } from '@granite-js/react-native';
import { useNavigationState } from '@react-navigation/native';
import { animated, useSpring } from '@react-spring/native';
import { colors } from '@toss/tds-colors';
import { Asset, shadow, useShadow } from '@toss/tds-react-native';
import type React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 임시 라우트 생성 (네비게이션 훅 사용을 위해)
const TempRoute = createRoute('/_layout' as any, { component: () => null });

export const BottomNavigation: React.FC = () => {
  const navigation = TempRoute.useNavigation();
  const insets = useSafeAreaInsets();

  // TDS Shadow 적용 (플로팅 탭바용)
  const shadowStyle = useShadow(shadow.medium('down'));

  // React Navigation의 현재 라우트 추적
  const currentRouteName = useNavigationState((state) => state?.routes[state.index]?.name);

  // 현재 경로의 탭바 설정 (Apps-in-Toss 가이드라인: 항상 플로팅 형태)
  const config = ROUTE_TAB_CONFIG[currentRouteName ?? '/'] ?? { isVisible: true };
  const { isVisible } = config;

  // 애니메이션 스타일
  const springStyle = useSpring({
    translateY: isVisible ? 0 : 100, // 숨김 시 아래로 100px 이동
    opacity: isVisible ? 1 : 0,
    config: { tension: 280, friction: 60 },
  });

  const isActiveRoute = (path: string) => {
    // 라우트 이름을 path와 매칭
    // 예: currentRouteName이 '/portfolio'이고 path가 '/portfolio'이면 활성화
    if (path === '/') {
      return currentRouteName === '/';
    }
    return currentRouteName?.startsWith(path);
  };

  return (
    <animated.View
      style={[
        styles.bottomNav,
        styles.bottomNavFloat,
        shadowStyle,
        {
          bottom: Math.max(insets.bottom, 8),
          transform: [{ translateY: springStyle.translateY }],
          opacity: springStyle.opacity,
        },
      ]}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = isActiveRoute(item.path);
        const iconColor = isActive ? undefined : colors.grey600;
        const textColor = isActive ? colors.blue500 : colors.grey600;

        return (
          <TouchableOpacity
            key={item.path}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => navigation.navigate(item.path as any)}
            accessibilityLabel={item.label}
          >
            <Asset.Icon frameShape={Asset.frameShape.CleanW24} name={item.iconName!} color={iconColor} />
            <Text style={[styles.navLabel, { color: textColor }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </animated.View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 25,
    paddingTop: 9,
    paddingBottom: 8,
  },
  bottomNavFloat: {
    // Apps-in-Toss 가이드라인: 항상 플로팅 형태 사용
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: 12,
    borderRadius: 30,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // 활성 상태는 색상으로만 구분
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16.5, // 1.5em (11 * 1.5)
    marginTop: 1, // 피그마 명세에 따른 아이콘-텍스트 간격
    textAlign: 'center',
  },
});
