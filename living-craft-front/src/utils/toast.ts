/**
 * Living Craft Toast Utility
 * Toast를 쉽게 사용하기 위한 헬퍼 함수
 */

import { ToastType, useToastStore } from '../store/toastStore';

/**
 * Toast 표시 옵션
 */
interface ShowToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

/**
 * Toast 표시
 */
export function showToast(options: ShowToastOptions | string) {
  const { showToast } = useToastStore.getState();

  if (typeof options === 'string') {
    showToast(options);
  } else {
    showToast(options.message, options.type, options.duration);
  }
}

/**
 * 성공 Toast 표시
 */
export function showSuccessToast(message: string) {
  showToast({ message, type: 'success' });
}

/**
 * 에러 Toast 표시
 */
export function showErrorToast(message: string) {
  showToast({ message, type: 'error' });
}

/**
 * 경고 Toast 표시
 */
export function showWarningToast(message: string) {
  showToast({ message, type: 'warning' });
}

/**
 * 정보 Toast 표시
 */
export function showInfoToast(message: string) {
  showToast({ message, type: 'info' });
}

/**
 * Toast 숨기기
 */
export function hideToast() {
  const { hideToast } = useToastStore.getState();
  hideToast();
}
