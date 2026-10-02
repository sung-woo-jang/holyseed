import type { QueryClient } from '@tanstack/react-query';

/** 근무기록이 바뀌면 월별 목록·정산·달력 점 표시·현장명 제안이 모두 옛 값을 쓰지 않도록 한꺼번에 무효화 */
export function invalidateWorklog(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['worklog'] }),
    qc.invalidateQueries({ queryKey: ['worklog-settlement'] }),
    qc.invalidateQueries({ queryKey: ['worklog-title-options'] }),
  ]);
}
