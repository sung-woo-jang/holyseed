export interface CalendarDay {
  date: number | null;
  fullDate: Date | null;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * 특정 년/월의 캘린더 그리드 데이터를 생성합니다.
 * 이전 달, 현재 달, 다음 달의 날짜를 포함한 6주(42일) 배열을 반환합니다.
 */
export function generateCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 현재 달의 첫날과 마지막 날
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);

  // 첫 주의 시작 요일 (일요일 = 0)
  const startDayOfWeek = firstDayOfMonth.getDay();

  // 마지막 날짜
  const daysInMonth = lastDayOfMonth.getDate();

  // 이전 달의 마지막 날
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();

  const grid: CalendarDay[] = [];

  // 이전 달의 날짜 채우기
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i;
    const fullDate = new Date(year, month - 2, date);
    grid.push({
      date,
      fullDate,
      isCurrentMonth: false,
      isToday: fullDate.getTime() === today.getTime(),
    });
  }

  // 현재 달의 날짜 채우기
  for (let date = 1; date <= daysInMonth; date++) {
    const fullDate = new Date(year, month - 1, date);
    grid.push({
      date,
      fullDate,
      isCurrentMonth: true,
      isToday: fullDate.getTime() === today.getTime(),
    });
  }

  // 다음 달의 날짜 채우기 (총 42칸 = 6주)
  const remainingDays = 42 - grid.length;
  for (let date = 1; date <= remainingDays; date++) {
    const fullDate = new Date(year, month, date);
    grid.push({
      date,
      fullDate,
      isCurrentMonth: false,
      isToday: fullDate.getTime() === today.getTime(),
    });
  }

  return grid;
}

/**
 * 날짜가 비활성화되어야 하는지 확인합니다.
 * - 과거 날짜는 비활성화
 * - disabledDates 배열에 포함된 날짜는 비활성화
 */
export function isDateDisabled(
  date: Date | null,
  minDate?: Date,
  maxDate?: Date,
  disabledDates?: Date[]
): boolean {
  if (!date) return true;

  // 과거 날짜 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return true;

  // 최소 날짜 체크
  if (minDate && date < minDate) return true;

  // 최대 날짜 체크
  if (maxDate && date > maxDate) return true;

  // 비활성화된 날짜 체크 (시간대 무시하고 날짜만 비교)
  if (disabledDates?.some((d) => {
    return d.getFullYear() === date.getFullYear() &&
           d.getMonth() === date.getMonth() &&
           d.getDate() === date.getDate();
  })) {
    return true;
  }

  return false;
}

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 형식의 문자열을 Date 객체로 변환합니다.
 */
export function parseStringToDate(dateString: string): Date | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}
