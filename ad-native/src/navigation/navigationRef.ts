import { createNavigationContainerRef } from '@react-navigation/native';

/** 앱 모드 전환 시 올바른 탭으로 강제 포커스하기 위한 전역 참조 (RootNavigator에서 사용) */
export const navigationRef = createNavigationContainerRef();
