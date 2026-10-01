import { setLaofusLastStrategy } from './prefs';

export type Strategy = 'laofus' | 'vr';

export const STRATEGY_FIRST_ROUTE: Record<Strategy, string> = { laofus: 'LaofusHome', vr: 'VrOverview' };

const lastRoute: Record<Strategy, string> = { ...STRATEGY_FIRST_ROUTE };

export function strategyOfRoute(routeName: string): Strategy {
  return routeName.startsWith('Vr') ? 'vr' : 'laofus';
}

/** 전략 안에서 마지막으로 본 화면을 기억 — 세그먼트로 전략을 바꿨다 돌아오면 그 화면으로 이동. 사이클 상세 같은 하위 화면은 기억하지 않음 */
export function rememberStrategyRoute(routeName: string): void {
  if (routeName === 'LaofusCycleDetail') return;
  const strategy = strategyOfRoute(routeName);
  lastRoute[strategy] = routeName;
  setLaofusLastStrategy(strategy).catch(() => undefined);
}

export function lastRouteOf(strategy: Strategy): string {
  return lastRoute[strategy];
}
