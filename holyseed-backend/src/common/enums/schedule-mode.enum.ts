/**
 * 스케줄 모드 (전역 설정에서 사용)
 */
export enum ScheduleMode {
  GLOBAL = 'global', // 전역 설정 사용
  WEEKDAYS = 'weekdays', // 평일만
  WEEKENDS = 'weekends', // 주말만
  EVERYDAY = 'everyday', // 매일
  CUSTOM = 'custom', // 커스텀 요일
  EVERYDAY_EXCEPT = 'everyday_except', // 매일 (특정 요일 제외)
}
