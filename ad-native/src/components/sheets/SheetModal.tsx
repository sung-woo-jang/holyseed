import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import { useSheetStore } from '../../stores/sheet.store';

interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  header?: string;
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
 * 하단 세이프에어리어 패딩은 일부러 안 넣는다 — 이 앱은 어느 화면에서도 하단 탭바가 사라지지
 * 않고, 탭바 자체가 이미 제스처 네비게이션 바 영역을 흡수하므로 시트는 애초에 거기 닿지 않는다.
 */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8; // PanResponder의 vy는 px/ms 단위

export default function SheetModal({ visible, onClose, header, cta, children, overlay }: SheetModalProps) {
  const theme = useTheme();
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) dragY.setValue(0);
  }, [visible, dragY]);

  useEffect(() => {
    if (!visible) return;
    const { open, close } = useSheetStore.getState();
    open();
    return close;
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      // 손잡이 View가 바깥 Pressable(스크림/전파차단)보다 더 깊은 자식이라, 터치 시작 즉시
      // 여기서 responder를 선점해야 Pressable의 onPress 협상에 뺏기지 않는다.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: Animated.event([null, { dy: dragY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          // Modal이 실제로 사라지기 전에 dragY를 0으로 되돌리면 그 찰나에 시트가 열린 위치로
          // 튀어 보였다가 사라지는 깜빡임이 생긴다 — onClose 이후 visible이 false가 되어
          // Modal이 언마운트된 다음(useEffect에서) 리셋되도록 여기서는 리셋하지 않는다.
          Animated.timing(dragY, { toValue: 800, duration: 200, useNativeDriver: false }).start(onClose);
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start();
        }
      },
    }),
  ).current;

  const translateY = dragY.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: 'clamp' });

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <Pressable style={styles.scrim} onPress={onClose}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View style={[styles.sheet, { backgroundColor: theme.card, transform: [{ translateY }] }]}>
                <View style={styles.handleWrap} hitSlop={{ top: 12, bottom: 12, left: 40, right: 40 }} {...panResponder.panHandlers}>
                  <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
                </View>
                {header && (
                  <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.headerText, { color: theme.text }]}>{header}</Text>
                  </View>
                )}
                <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                  {children}
                </ScrollView>
                {cta && (
                  <View style={[styles.ctaWrap, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
                    {cta}
                  </View>
                )}
              </Animated.View>
            </Pressable>
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
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14, borderBottomWidth: 1 },
  headerText: { fontSize: 17, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
});
