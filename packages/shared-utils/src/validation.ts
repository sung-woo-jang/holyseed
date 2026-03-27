/**
 * 이메일 주소의 유효성을 검사합니다.
 * @param email - 검사할 이메일 주소
 * @returns 유효한 이메일이면 true, 아니면 false
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 한국 휴대폰 번호의 유효성을 검사합니다.
 * @param phone - 검사할 휴대폰 번호 (010-1234-5678 또는 01012345678 형식)
 * @returns 유효한 휴대폰 번호이면 true, 아니면 false
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^010-?\d{4}-?\d{4}$/
  return phoneRegex.test(phone)
}

/**
 * 휴대폰 번호를 포맷팅합니다.
 * @param phone - 포맷팅할 휴대폰 번호
 * @returns '010-1234-5678' 형식의 문자열
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

/**
 * 비밀번호 강도를 검사합니다.
 * @param password - 검사할 비밀번호
 * @returns 최소 8자, 대소문자, 숫자, 특수문자 포함 시 true
 */
export function validatePassword(password: string): boolean {
  // 최소 8자, 대문자, 소문자, 숫자, 특수문자 포함
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

/**
 * 문자열이 비어있는지 검사합니다.
 * @param value - 검사할 문자열
 * @returns 비어있거나 공백만 있으면 true, 아니면 false
 */
export function isEmpty(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim().length === 0
}

/**
 * URL의 유효성을 검사합니다.
 * @param url - 검사할 URL
 * @returns 유효한 URL이면 true, 아니면 false
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
