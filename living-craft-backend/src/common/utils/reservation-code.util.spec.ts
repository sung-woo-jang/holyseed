// ReservationCodeUtil 유틸리티 클래스 테스트
import { ReservationCodeUtil } from './reservation-code.util';
// moment.js: 날짜 처리를 위한 라이브러리
import moment from 'moment';

// ReservationCodeUtil 클래스에 대한 테스트 스위트
describe('ReservationCodeUtil', () => {
  // generate 메소드에 대한 테스트 그룹
  describe('generate', () => {
    // 기본값(현재 날짜, 순번 1)으로 예약번호 생성 테스트
    it('기본값으로 예약번호 생성', () => {
      // ReservationCodeUtil.generate()를 매개변수 없이 호출
      // 내부적으로 현재 날짜와 순번 1을 사용함
      const code = ReservationCodeUtil.generate();

      // 현재 날짜를 YYYYMMDD 형식으로 변환
      const today = moment().format('YYYYMMDD');

      // 생성된 코드가 "오늘날짜-0001" 패턴인지 정규표현식으로 검증
      expect(code).toMatch(new RegExp(`^${today}-\\d{4}$`));
      // 전체적으로 YYYYMMDD-NNNN 패턴인지 검증
      expect(code).toMatch(/^\d{8}-\d{4}$/);
    });

    // 특정 날짜와 순번을 지정한 예약번호 생성 테스트
    it('특정 날짜와 순번으로 예약번호 생성', () => {
      // 테스트용 날짜 생성 (2024년 1월 15일)
      const date = new Date('2024-01-15');
      // 테스트용 순번
      const sequence = 5;

      // 지정된 날짜와 순번으로 예약번호 생성
      const code = ReservationCodeUtil.generate(date, sequence);

      // 예상 결과와 정확히 일치하는지 검증
      expect(code).toBe('20240115-0005');
    });

    // 순번이 4자리를 넘어가는 경우 테스트 (에지 케이스)
    it('순번이 9999를 넘어도 정상 생성', () => {
      const date = new Date('2024-12-31');
      const sequence = 10000; // 5자리 순번

      const code = ReservationCodeUtil.generate(date, sequence);

      // 5자리 순번도 정상적으로 처리되는지 검증
      expect(code).toBe('20241231-10000');
    });
  });

  // extractDate 메소드에 대한 테스트 그룹
  describe('extractDate', () => {
    // 정상적인 예약번호에서 날짜 추출 테스트
    it('유효한 예약번호에서 날짜 추출', () => {
      // 테스트용 예약번호
      const reservationCode = '20240115-0001';

      // 예약번호에서 날짜 부분 추출
      const date = ReservationCodeUtil.extractDate(reservationCode);

      // 반환된 값이 Date 객체인지 확인
      expect(date).toBeInstanceOf(Date);
      // 추출된 날짜가 예상한 날짜(2024-01-15)와 일치하는지 확인
      expect(moment(date).format('YYYY-MM-DD')).toBe('2024-01-15');
    });

    // 잘못된 형식의 예약번호들에 대한 테스트
    it('잘못된 형식의 예약번호는 null 반환', () => {
      // 다양한 잘못된 형식들을 배열로 정의
      const invalidCodes = [
        'invalid-code', // 완전히 잘못된 형식
        '2024011-0001', // 날짜 부분이 7자리 (8자리여야 함)
        '20240115-001', // 순번 부분이 3자리 (4자리여야 함)
        '20240115_0001', // 구분자가 하이픈이 아닌 언더스코어
        '', // 빈 문자열
      ];

      // 모든 잘못된 코드들이 null을 반환하는지 검증
      invalidCodes.forEach((code) => {
        expect(ReservationCodeUtil.extractDate(code)).toBeNull();
      });
    });

    // 형식은 맞지만 존재하지 않는 날짜에 대한 테스트
    it('존재하지 않는 날짜는 null 반환', () => {
      // 2024년은 윤년이므로 2월 29일이 존재함 - 유효한 날짜
      const validLeapYearDate = '20240229-0001';
      const result = ReservationCodeUtil.extractDate(validLeapYearDate);
      expect(result).toBeInstanceOf(Date);

      // 2023년은 평년이므로 2월 29일이 존재하지 않음 - 무효한 날짜
      const invalidDate = '20230229-0001';
      const result2 = ReservationCodeUtil.extractDate(invalidDate);
      expect(result2).toBeNull();
    });
  });

  // extractSequence 메소드에 대한 테스트 그룹
  describe('extractSequence', () => {
    // 정상적인 예약번호에서 순번 추출 테스트
    it('유효한 예약번호에서 순번 추출', () => {
      const reservationCode = '20240115-0123';

      // 예약번호에서 순번 부분 추출
      const sequence = ReservationCodeUtil.extractSequence(reservationCode);

      // 추출된 순번이 123인지 확인 (앞의 0들은 제거됨)
      expect(sequence).toBe(123);
    });

    // 잘못된 형식에 대한 테스트
    it('잘못된 형식의 예약번호는 null 반환', () => {
      const invalidCodes = [
        'invalid-code', // 잘못된 형식
        '2024011-0001', // 날짜 부분 길이 오류
        '20240115-001', // 순번 부분 길이 오류
        '20240115_0001', // 구분자 오류
        '', // 빈 문자열
      ];

      // 모든 잘못된 코드에 대해 null 반환 검증
      invalidCodes.forEach((code) => {
        expect(ReservationCodeUtil.extractSequence(code)).toBeNull();
      });
    });
  });

  // isValid 메소드에 대한 테스트 그룹
  describe('isValid', () => {
    // 유효한 예약번호들에 대한 검증 테스트
    it('유효한 예약번호 검증', () => {
      const validCodes = [
        '20240115-0001', // 일반적인 유효한 코드
        '20240229-9999', // 윤년의 2월 29일 (2024년)
        '19990101-0001', // 과거 날짜
        '20991231-0001', // 먼 미래 날짜
      ];

      // 모든 유효한 코드들이 true를 반환하는지 검증
      validCodes.forEach((code) => {
        expect(ReservationCodeUtil.isValid(code)).toBe(true);
      });
    });

    // 잘못된 예약번호들에 대한 검증 테스트
    it('잘못된 예약번호 검증', () => {
      const invalidCodes = [
        'invalid-code', // 완전히 잘못된 형식
        '2024011-0001', // 날짜 부분 길이 오류
        '20240115-001', // 순번 부분 길이 오류
        '20240115_0001', // 구분자 오류 (언더스코어)
        '20230229-0001', // 평년의 2월 29일 (존재하지 않음)
        '20240132-0001', // 1월 32일 (존재하지 않는 날짜)
        '20241301-0001', // 13월 (존재하지 않는 월)
        '', // 빈 문자열
        null, // null 값
        undefined, // undefined 값
      ];

      // 모든 잘못된 코드들이 false를 반환하는지 검증
      invalidCodes.forEach((code) => {
        expect(ReservationCodeUtil.isValid(code as string)).toBe(false);
      });
    });
  });

  // getNextSequence 메소드에 대한 테스트 그룹
  describe('getNextSequence', () => {
    // 기존 예약번호가 없는 경우 테스트
    it('기존 예약번호가 없는 경우 1 반환', () => {
      const date = new Date('2024-01-15');
      const existingCodes: string[] = []; // 빈 배열 (기존 예약없음)

      // 첫 번째 예약이므로 순번 1이 반환되어야 함
      const sequence = ReservationCodeUtil.getNextSequence(date, existingCodes);

      expect(sequence).toBe(1);
    });

    // 같은 날짜에 기존 예약들이 있는 경우 테스트
    it('같은 날짜의 예약번호들 중 최대값 + 1 반환', () => {
      const date = new Date('2024-01-15');
      const existingCodes = [
        '20240115-0001', // 순번 1
        '20240115-0003', // 순번 3
        '20240115-0002', // 순번 2 (순서 상관없이 배열에 포함)
        '20240114-0005', // 다른 날짜 (1월 14일) - 무시되어야 함
        '20240116-0010', // 다른 날짜 (1월 16일) - 무시되어야 함
      ];

      // 같은 날짜(1월 15일)의 최대 순번이 3이므로, 다음 순번은 4
      const sequence = ReservationCodeUtil.getNextSequence(date, existingCodes);

      expect(sequence).toBe(4);
    });

    // 잘못된 형식의 예약번호가 섞여있는 경우 테스트
    it('잘못된 형식의 예약번호는 무시', () => {
      const date = new Date('2024-01-15');
      const existingCodes = [
        '20240115-0001', // 유효한 코드 - 순번 1
        'invalid-code', // 잘못된 형식 - 무시됨
        '20240115-0002', // 유효한 코드 - 순번 2
        '20240115_0003', // 잘못된 형식 (언더스코어) - 무시됨
      ];

      // 유효한 코드들(순번 1, 2) 중 최대값 2의 다음인 3이 반환되어야 함
      const sequence = ReservationCodeUtil.getNextSequence(date, existingCodes);

      expect(sequence).toBe(3);
    });
  });
});
