import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/** 화면이 포커스돼 있고 앱이 활성일 때만 폴링 간격(ms)을 돌려준다 — 그 외엔 false라서 react-query가 폴링을 멈춘다 */
export function useLiveInterval(ms: number): number | false {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return focused && active ? ms : false;
}

/** enabled일 때만 1초마다 현재 시각(ms)을 갱신 — "N초 전" 표시용 */
export function useNowTick(enabled: boolean): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}
