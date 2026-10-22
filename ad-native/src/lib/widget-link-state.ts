// 위젯 탭으로 들어온 화면 이동이 진행 중인지 — RootNavigator의 "모드 바뀌면 첫 탭으로 강제 이동"이
// 위젯이 막 이동시킨 화면을 덮어쓰지 않게 하려고 공유한다 (widget-links ↔ RootNavigator 순환 import 방지용 별도 모듈).

const GRACE_MS = 1500;

let active = false;
let graceUntil = 0;

export function setWidgetLinkActive(value: boolean): void {
  active = value;
  // 이동이 끝난 직후에 늦게 도는 효과(가구 목록 갱신 등)가 덮어쓰지 못하도록 잠깐 더 유지
  if (!value) graceUntil = Date.now() + GRACE_MS;
}

export function isWidgetLinkActive(): boolean {
  return active || Date.now() < graceUntil;
}
