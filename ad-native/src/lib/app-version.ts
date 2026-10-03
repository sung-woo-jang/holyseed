import Constants from 'expo-constants';

/** 설정·더보기 하단 버전 문구 — app.json의 version을 그대로 쓴다(하드코딩 금지) */
export const APP_VERSION_LABEL = `자산일기 v${Constants.expoConfig?.version ?? '?'}`;
