import { StackActions } from '@react-navigation/native';

/**
 * 저장 완료 후 "이전에 있던 화면"으로 돌아가며 결과 파라미터(토스트용 savedMode 등)를 전달한다.
 * React Navigation 7의 navigate는 이름이 같아도 현재 화면이 아니면 새 화면을 위에 쌓는다 — 그러면 상세 화면은 id 없이 열려
 * "찾을 수 없어요"가 뜨고, 목록 화면은 두 겹이 돼 뒤로가기가 입력 폼으로 돌아간다. popTo(merge)는 스택에 있는 기존 화면까지 닫고
 * 그 화면의 기존 파라미터(id 등)를 유지한 채 새 값만 얹는다. 스택에 없으면 새로 연다.
 */
export function popToScreen(navigation: { dispatch: (action: ReturnType<typeof StackActions.popTo>) => void }, name: string, params?: object): void {
  navigation.dispatch(StackActions.popTo(name, params, { merge: true }));
}
