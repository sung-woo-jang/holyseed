import { create } from 'zustand';

interface SheetState {
  openCount: number;
  open: () => void;
  close: () => void;
}

/**
 * Android에서 RN의 Modal은 별도 OS Window(Dialog)로 뜨는데, 이 Window가 하단 탭바 영역까지
 * 덮지 못하는 게 RN 자체의 미해결 업스트림 한계다(edge-to-edge + Modal 조합, prop으로 못 고침).
 * 대신 시트가 열려있는 동안 탭바를 시트 배경색과 맞춰 숨겨서, 탭바가 시트 아래로 그대로
 * 비쳐 보이는 "떠 있는" 느낌을 없앤다. — MainTabNavigator, SheetModal에서 함께 사용.
 */
export const useSheetStore = create<SheetState>((set) => ({
  openCount: 0,
  open: () => set((s) => ({ openCount: s.openCount + 1 })),
  close: () => set((s) => ({ openCount: Math.max(0, s.openCount - 1) })),
}));
