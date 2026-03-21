/**
 * Living Craft Toast Store
 * Toast 메시지를 전역으로 관리하기 위한 Zustand 스토어
 */

import { create } from 'zustand';

/**
 * Toast 타입
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast 스토어 상태 타입
 */
interface ToastState {
  // 상태
  open: boolean;
  message: string;
  type: ToastType;
  duration: number;

  // 액션
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

/**
 * Toast 스토어 생성
 */
export const useToastStore = create<ToastState>((set) => ({
  // 초기 상태
  open: false,
  message: '',
  type: 'info',
  duration: 3,

  /**
   * Toast 표시
   */
  showToast: (message: string, type: ToastType = 'info', duration: number = 3) => {
    set({ open: true, message, type, duration });
  },

  /**
   * Toast 숨기기
   */
  hideToast: () => {
    set({ open: false });
  },
}));

/**
 * Toast 스토어 기본 export
 */
export default useToastStore;
