import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { useSheetStore } from '../../stores/sheet.store';

interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  header?: string;
  /** 헤더 텍스트 옆(우측)에 놓는 보조 액션 (예: 편집 토글) */
  headerRight?: ReactNode;
  cta?: ReactNode;
  children: ReactNode;
  /** 시트 위에 겹쳐 그리는 오버레이(날짜 피커 등) */
  overlay?: ReactNode;
}

/**
 * @gorhom/bottom-sheet(BottomSheetModal)는 이 앱 환경에서 present()는 성공해도 실제 화면엔 전혀
 * 안 뜨는 근본 버그가 있어 제거했고, 뒤이어 시도한 slide 애니메이션(네이티브 animationType="slide",
 * 그리고 JS Animated로 직접 translateY 계산한 버전) 둘 다 화면 높이 계산이 기기/시트마다 어긋나
 * "다 올라오지 못하고 잘리는" 문제가 있었다. `fade`는 위치를 옮기지 않고 투명도만 바꾸므로
 * 이런 계산 오차가 생길 여지가 없다 — ConfirmDialog가 이미 같은 방식(fade + 중앙 정렬)으로
 * 문제 없이 동작해온 것과 동일한 패턴을, 하단 정렬로만 바꿔 적용.
 *
 * 드래그-다운 닫기는 처음에 react-native-gesture-handler의 PanGestureHandler로 구현했다가
 * (Modal은 별도 네이티브 Dialog 윈도우라 그 안에서 PanGestureHandler를 쓰려면 GestureHandlerRootView로
 * 한 번 더 감싸야 하는데) 그 조합이 이 환경에서 앱 전체 네이티브 크래시를 일으켜 제거했다.
 * 대신 RN 코어 내장 PanResponder로 재구현 — 별도 네이티브 뷰/루트가 필요 없는 순수 JS 터치
 * responder라 Modal 안에서도 추가 래핑 없이 안전하게 동작한다.
 *
 * Modal은 앱의 일반 화면과 달리 하단 탭바(제스처 네비게이션 바 영역을 이미 흡수하고 있는)의
 * 보호를 받지 못하는 완전히 별도의 창이라, 시스템 네비게이션 바(뒤로가기/홈/최근앱) 영역까지
 * 그대로 침범해서 그려진다 — 그래서 이 컴포넌트 자체에는 하단 세이프에어리어 패딩이 필요하다
 * (반면 화면 자체의 하단 고정 버튼은 탭바가 이미 보호하므로 중복 패딩을 넣으면 안 된다).
 *
 * 드래그 가능 영역은 유튜브 댓글창과 동일하게 3단으로 나뉜다:
 * 1) 손잡이+헤더 — 어디를 터치해서 드래그해도 항상 시트가 반응 (headerPanResponder)
 * 2) 본문(ScrollView) — 스크롤이 맨 위(0)일 때 아래로 당기면 그 순간부터 시트가 같이 내려감
 * 3) CTA 영역 — 드래그 핸들러를 아예 안 붙여서 항상 그대로 버튼으로만 동작
 *
 * 2번은 원래 PanResponder의 capture 단계로 ScrollView의 터치를 가로채려 했으나 동작하지
 * 않았다 — 안드로이드 ScrollView는 손가락이 조금만 움직여도 곧바로
 * `requestDisallowInterceptTouchEvent(true)`를 호출해 네이티브 레벨에서 부모의 터치 가로채기
 * 자체를 막아버리기 때문에(JS 레벨 PanResponder capture로는 우회 불가), 대신 ScrollView의
 * onScroll이 보고하는 오버스크롤(맨 위에서 더 당겼을 때의 음수 contentOffset)을 그대로
 * dragY에 반영하는 방식으로 구현 — 터치를 가로채지 않고 ScrollView가 처리한 결과를 관찰만
 * 하므로 네이티브 터치 소유권 다툼이 아예 없다.
 */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8; // PanResponder의 vy는 px/ms 단위
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SheetModal({ visible, onClose, header, headerRight, cta, children, overlay }: SheetModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dragY = useRef(new Animated.Value(0)).current;
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (visible) dragY.setValue(0);
  }, [visible, dragY]);

  useEffect(() => {
    if (!visible) return;
    const { open, close } = useSheetStore.getState();
    open();
    return close;
  }, [visible]);

  const onDragMove = Animated.event([null, { dy: dragY }], { useNativeDriver: false });
  function onDragRelease(_: unknown, gesture: { dy: number; vy: number }) {
    if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
      // Modal이 실제로 사라지기 전에 dragY를 0으로 되돌리면 그 찰나에 시트가 열린 위치로
      // 튀어 보였다가 사라지는 깜빡임이 생긴다 — onClose 이후 visible이 false가 되어
      // Modal이 언마운트된 다음(useEffect에서) 리셋되도록 여기서는 리셋하지 않는다.
      Animated.timing(dragY, { toValue: 800, duration: 200, useNativeDriver: false }).start(onClose);
    } else {
      Animated.spring(dragY, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start();
    }
  }

  const headerPanResponder = useRef(
    PanResponder.create({
      // 손잡이+헤더 아래엔 스크롤 콘텐츠가 없어서, 터치 시작 즉시 여기서 responder를 선점해도
      // (바깥 Pressable의 onPress 협상에 뺏기지 않도록) 스크롤과 충돌할 일이 없다.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: onDragMove,
      onPanResponderRelease: onDragRelease,
    }),
  ).current;

  function onBodyScroll(y: number) {
    scrollYRef.current = y;
    // 맨 위에서 더 당긴 만큼(음수 오버스크롤)을 그대로 시트 드래그 거리로 반영
    if (y < 0) dragY.setValue(-y);
  }

  function onBodyScrollEndDrag() {
    if (scrollYRef.current < -DISMISS_DISTANCE) {
      Animated.timing(dragY, { toValue: 800, duration: 200, useNativeDriver: false }).start(onClose);
    }
    // 임계값 미만이면 별도 처리 불필요 — ScrollView 자체가 0으로 되돌아오면서 dragY도 같이 0으로 따라옴
  }

  const translateY = dragY.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: 'clamp' });

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.scrim} onPress={onClose}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
            <AnimatedPressable
              onPress={(e) => e.stopPropagation()}
              style={[styles.sheet, { backgroundColor: theme.card, transform: [{ translateY }] }]}
            >
              <View {...headerPanResponder.panHandlers}>
                <View style={styles.handleWrap}>
                  <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
                </View>
                {header && (
                  <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.headerText, { color: theme.text }]}>{header}</Text>
                    {headerRight}
                  </View>
                )}
              </View>
              <ScrollView
                contentContainerStyle={[styles.body, !cta && { paddingBottom: 24 + insets.bottom }]}
                keyboardShouldPersistTaps="handled"
                overScrollMode="always"
                onScroll={(e) => onBodyScroll(e.nativeEvent.contentOffset.y)}
                onScrollEndDrag={onBodyScrollEndDrag}
                scrollEventThrottle={16}
              >
                {children}
              </ScrollView>
              {cta && (
                <View style={[styles.ctaWrap, { paddingBottom: 20 + insets.bottom, borderTopColor: theme.border, backgroundColor: theme.card }]}>
                  {cta}
                </View>
              )}
            </AnimatedPressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
      {overlay}
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  handleWrap: { alignItems: 'center', paddingVertical: 8 },
  handleBar: { width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14, borderBottomWidth: 1 },
  headerText: { fontSize: 17, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
});
