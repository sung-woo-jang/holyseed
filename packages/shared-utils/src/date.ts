import { format, parseISO } from 'date-fns'

/**
 * 날짜를 지정된 패턴으로 포맷팅합니다.
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @param pattern - 날짜 패턴 (기본값: 'yyyy-MM-dd')
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd'): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return format(parsedDate, pattern)
}

/**
 * 날짜와 시간을 포맷팅합니다.
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @returns 'yyyy-MM-dd HH:mm' 형식의 문자열
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm')
}

/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @returns 'yyyy년 MM월 dd일' 형식의 문자열
 */
export function formatDateKorean(date: string | Date): string {
  return formatDate(date, 'yyyy년 MM월 dd일')
}

/**
 * 시간을 포맷팅합니다.
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @returns 'HH:mm' 형식의 문자열
 */
export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm')
}
