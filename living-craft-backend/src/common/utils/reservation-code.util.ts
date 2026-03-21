import moment from 'moment';

/**
 * 예약번호 생성 및 관리 유틸리티 클래스
 * 형식: YYYYMMDD-NNNN (예: 20240115-0001)
 */
export class ReservationCodeUtil {
  /**
   * 예약번호 생성
   * @param date - 예약 날짜 (기본값: 현재 날짜)
   * @param sequence - 순번 (기본값: 1)
   * @returns 생성된 예약번호 (형식: YYYYMMDD-NNNN)
   */
  static generate(date: Date = new Date(), sequence: number = 1): string {
    const dateStr = moment(date).format('YYYYMMDD');
    const sequenceStr = sequence.toString().padStart(4, '0');
    return `${dateStr}-${sequenceStr}`;
  }

  /**
   * 예약번호에서 날짜 추출
   * @param reservationCode - 예약번호
   * @returns 추출된 날짜 또는 null (잘못된 형식인 경우)
   */
  static extractDate(reservationCode: string): Date | null {
    if (!this.isValid(reservationCode)) {
      return null;
    }

    const dateStr = reservationCode.split('-')[0];
    const date = moment(dateStr, 'YYYYMMDD', true);

    if (!date.isValid()) {
      return null;
    }

    return date.toDate();
  }

  /**
   * 예약번호에서 순번 추출
   * @param reservationCode - 예약번호
   * @returns 추출된 순번 또는 null (잘못된 형식인 경우)
   */
  static extractSequence(reservationCode: string): number | null {
    if (!this.isValid(reservationCode)) {
      return null;
    }

    const sequenceStr = reservationCode.split('-')[1];
    return parseInt(sequenceStr, 10);
  }

  /**
   * 예약번호 형식 검증
   * @param reservationCode - 검증할 예약번호
   * @returns 유효 여부
   */
  static isValid(reservationCode: string): boolean {
    if (!reservationCode || typeof reservationCode !== 'string') {
      return false;
    }

    // 형식 검증: YYYYMMDD-NNNN (최소 4자리 숫자)
    const pattern = /^(\d{8})-(\d{4,})$/;
    const match = reservationCode.match(pattern);

    if (!match) {
      return false;
    }

    // 날짜 유효성 검증
    const dateStr = match[1];
    const date = moment(dateStr, 'YYYYMMDD', true);

    return date.isValid();
  }

  /**
   * 다음 순번 계산
   * @param date - 예약 날짜
   * @param existingCodes - 기존 예약번호 목록
   * @returns 다음 순번
   */
  static getNextSequence(date: Date, existingCodes: string[]): number {
    const targetDateStr = moment(date).format('YYYYMMDD');

    // 같은 날짜의 예약번호만 필터링
    const sameDateCodes = existingCodes.filter((code) => {
      if (!this.isValid(code)) {
        return false;
      }
      return code.startsWith(targetDateStr);
    });

    // 기존 예약이 없으면 1 반환
    if (sameDateCodes.length === 0) {
      return 1;
    }

    // 최대 순번 찾기
    const maxSequence = Math.max(
      ...sameDateCodes.map((code) => this.extractSequence(code) || 0),
    );

    return maxSequence + 1;
  }
}
