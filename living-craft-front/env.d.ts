/**
 * 환경 변수 타입 정의
 * react-native-dotenv에서 사용하는 환경 변수의 타입을 정의합니다.
 */
declare module '@env' {
  export const API_BASE_URL: string;
  export const TOSS_CLIENT_ID: string;
  export const TOSS_REFERRER: string;
  export const KAKAO_REST_API_KEY: string;
  export const NAVER_CLIENT_ID: string;
  export const NAVER_CLIENT_SECRET: string;
}
