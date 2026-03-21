export class PhoneUtil {
  /**
   * 전화번호에서 하이픈 제거
   */
  static removeHyphen(phone: string): string {
    return phone.replace(/-/g, '');
  }

  /**
   * 전화번호 정규화 (표준 하이픈 형식으로 변환)
   */
  static normalize(phone: string): string {
    // 숫자만 추출
    const digitsOnly = phone.replace(/[^\d]/g, '');

    // 휴대폰 번호 (11자리, 010으로 시작)
    if (digitsOnly.length === 11 && digitsOnly.startsWith('010')) {
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
    }

    // 서울 지역번호 (10자리, 02로 시작)
    if (digitsOnly.length === 10 && digitsOnly.startsWith('02')) {
      return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
    }

    // 기타 지역번호 (11자리, 03~06으로 시작)
    if (digitsOnly.length === 11 && /^0[3-6]/.test(digitsOnly)) {
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
    }

    // 변환할 수 없는 경우 원본 반환
    return phone;
  }

  /**
   * 데이터베이스 저장용 정규화 (하이픈 제거)
   */
  static normalizeForStorage(phone: string): string {
    // 공백, 하이픈, 괄호 등 특수문자 제거
    return phone.replace(/[\s\-\(\)]/g, '');
  }

  /**
   * 전화번호 마스킹 (개인정보 보호)
   * 010-1234-5678 -> 010-****-5678
   */
  static mask(phone: string): string {
    // 하이픈이 없는 경우 먼저 정규화 시도
    const normalized = phone.includes('-') ? phone : this.normalize(phone);

    // 정규화된 형식인지 확인 (하이픈 포함)
    if (normalized.includes('-')) {
      const parts = normalized.split('-');
      if (parts.length === 3) {
        return `${parts[0]}-****-${parts[2]}`;
      }
    }

    // 마스킹할 수 없는 경우 원본 반환
    return phone;
  }

  /**
   * 전화번호 형식 검증
   */
  static isValid(phone: string): boolean {
    // 정규화 시도
    const normalized = this.normalize(phone);

    // 정규화가 성공했는지 확인 (하이픈이 포함되어야 함)
    if (!normalized.includes('-')) {
      return false;
    }

    const parts = normalized.split('-');
    if (parts.length !== 3) {
      return false;
    }

    const [area, middle, last] = parts;

    // 휴대폰 번호 검증 (010-XXXX-XXXX)
    if (area === '010') {
      return middle.length === 4 && last.length === 4;
    }

    // 서울 지역번호 검증 (02-XXXX-XXXX)
    if (area === '02') {
      return middle.length === 4 && last.length === 4;
    }

    // 기타 지역번호 검증 (0XX-XXXX-XXXX)
    if (area.length === 3 && /^0[3-6]\d$/.test(area)) {
      return middle.length === 4 && last.length === 4;
    }

    return false;
  }

  /**
   * 전화번호 포맷팅 (표시용) - normalize와 동일
   */
  static format(phone: string): string {
    return this.normalize(phone);
  }
}
