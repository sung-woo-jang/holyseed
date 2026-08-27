import LabMainTabNavigator from './LabMainTabNavigator';

/**
 * Lab 모드로 들어왔다는 건 이미 ad 앱에 로그인돼 있다는 뜻(같은 소유자의 ad 토큰을
 * /api/lab에서도 그대로 받아주도록 백엔드가 완화됨) — 별도 로그인 게이트 불필요.
 */
export default function LabRootNavigator() {
  return <LabMainTabNavigator />;
}
