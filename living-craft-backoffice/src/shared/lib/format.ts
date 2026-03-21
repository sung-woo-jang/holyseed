/**
 * 공통 포맷 함수
 * 날짜, 숫자, 전화번호, 주소 등의 포맷팅
 */
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

// ===== 날짜 포맷 =====

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'yyyy-MM-dd', { locale: ko })
  } catch {
    return '-'
  }
}

/**
 * 날짜를 YYYY.MM.DD 형식으로 포맷
 */
export function formatDateDot(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'yyyy.MM.dd', { locale: ko })
  } catch {
    return '-'
  }
}

/**
 * 날짜와 시간을 YYYY-MM-DD HH:mm 형식으로 포맷
 */
export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'yyyy-MM-dd HH:mm', { locale: ko })
  } catch {
    return '-'
  }
}

/**
 * 날짜와 시간을 YYYY.MM.DD HH:mm 형식으로 포맷
 */
export function formatDateTimeDot(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'yyyy.MM.dd HH:mm', { locale: ko })
  } catch {
    return '-'
  }
}

/**
 * 시간을 HH:mm 형식으로 포맷
 */
export function formatTime(time: string): string {
  try {
    // HH:mm 형식이 아니면 그대로 반환
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return time
    }
    return time
  } catch {
    return '-'
  }
}

/**
 * 상대 시간 표시 (예: 3시간 전, 5일 전)
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: ko,
    })
  } catch {
    return '-'
  }
}

/**
 * 요일 한글 변환
 */
export function formatDayOfWeek(day: string): string {
  const dayMap: { [key: string]: string } = {
    monday: '월요일',
    tuesday: '화요일',
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일',
  }
  return dayMap[day] || day
}

// ===== 숫자 포맷 =====

/**
 * 숫자를 천 단위 구분 기호와 함께 포맷 (예: 1,234,567)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

/**
 * 금액 포맷 (예: 1,234,567원)
 */
export function formatCurrency(amount: number): string {
  return `${formatNumber(amount)}원`
}

/**
 * 퍼센트 포맷 (예: 85.5%)
 */
export function formatPercent(value: number, decimals = 1): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-'
  }
  return `${value.toFixed(decimals)}%`
}

/**
 * 평점 포맷 (예: 4.5 / 5.0)
 */
export function formatRating(rating: number): string {
  if (typeof rating !== 'number' || !Number.isFinite(rating)) {
    return '- / 5.0'
  }
  return `${rating.toFixed(1)} / 5.0`
}

// ===== 전화번호 포맷 =====

/**
 * 전화번호 포맷 (예: 010-1234-5678)
 */
export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const cleaned = phone.replace(/\D/g, '')

  // 010-XXXX-XXXX 형식
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  // 02-XXX-XXXX 또는 02-XXXX-XXXX 형식 (서울)
  if (cleaned.startsWith('02')) {
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
    }
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
  }

  // 0XX-XXX-XXXX 또는 0XX-XXXX-XXXX 형식 (지역번호)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && !cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  // 포맷할 수 없으면 원본 반환
  return phone
}

// ===== 주소 포맷 =====

/**
 * 주소를 축약 (예: "서울특별시 강남구 테헤란로 123" → "서울 강남구...")
 */
export function formatAddressShort(address: string, maxLength = 20): string {
  if (address.length <= maxLength) {
    return address
  }

  // 시/도와 구/군까지만 표시
  const parts = address.split(' ')
  if (parts.length >= 2) {
    const shortAddress = `${parts[0].replace('특별시', '').replace('광역시', '')} ${parts[1]}`
    if (shortAddress.length <= maxLength) {
      return `${shortAddress}...`
    }
  }

  return `${address.slice(0, maxLength)}...`
}

/**
 * 전체 주소 포맷 (도로명 주소 + 상세 주소)
 */
export function formatFullAddress(
  address: string,
  detailAddress?: string
): string {
  if (!detailAddress) {
    return address
  }
  return `${address} ${detailAddress}`
}

// ===== 예약 상태 포맷 =====

/**
 * 예약 상태를 한글로 변환
 */
export function formatReservationStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    pending: '대기',
    confirmed: '확정',
    completed: '완료',
    cancelled: '취소',
  }
  return statusMap[status] || status
}

/**
 * 예약 상태에 따른 배지 색상 반환
 */
export function getReservationStatusColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    pending: 'warning',
    confirmed: 'info',
    completed: 'success',
    cancelled: 'destructive',
  }
  return colorMap[status] || 'secondary'
}

// ===== 파일 크기 포맷 =====

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환 (예: 1.5 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// ===== 텍스트 포맷 =====

/**
 * 텍스트 줄임 (말줄임표 추가)
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}...`
}

/**
 * 개행 문자를 <br> 태그로 변환
 */
export function nl2br(text: string): string {
  return text.replace(/\n/g, '<br />')
}
