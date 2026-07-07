import { useEffect, useRef } from 'react';

/**
 * 시트/다이얼로그를 기기 뒤로가기와 연동한다 (모바일 앱 UX).
 * - 열리면 history state를 push → 뒤로가기 시 "가장 위" 시트만 닫힘 (LIFO)
 * - 버튼/백드롭으로 닫으면 push해둔 state를 back()으로 정리
 * - 전역 스택 하나로 관리해 중첩 시트에서 popstate가 이중 처리되지 않는다
 */

interface StackEntry {
  close: () => void;
  markPopped: () => void;
}

const stack: StackEntry[] = [];
// 코드에서 호출한 history.back()이 만든 popstate는 무시
let suppressNextPop = 0;
let listenerAttached = false;

function ensureListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('popstate', () => {
    if (suppressNextPop > 0) {
      suppressNextPop--;
      return;
    }
    const top = stack.pop();
    if (top) {
      top.markPopped();
      top.close();
    }
  });
}

export function useBackClose(visible: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!visible) return;
    ensureListener();

    let popped = false;
    const entry: StackEntry = {
      close: () => onCloseRef.current(),
      markPopped: () => { popped = true; },
    };

    window.history.pushState({ sheet: true }, '');
    stack.push(entry);

    return () => {
      const idx = stack.indexOf(entry);
      if (idx >= 0) stack.splice(idx, 1);
      // 뒤로가기가 아닌 방법(버튼·백드롭)으로 닫힘 → push한 state 제거
      if (!popped && window.history.state?.sheet) {
        suppressNextPop++;
        window.history.back();
      }
    };
  }, [visible]);
}
