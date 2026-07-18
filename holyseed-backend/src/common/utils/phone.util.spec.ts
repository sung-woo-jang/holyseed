// PhoneUtil 유틸리티 클래스 테스트
import { PhoneUtil } from './phone.util';

// PhoneUtil 클래스의 모든 메소드들에 대한 테스트 스위트
describe('PhoneUtil', () => {
  // normalize 메소드에 대한 테스트 그룹
  // 이 메소드는 다양한 형태의 전화번호를 표준 형식으로 변환함
  describe('normalize', () => {
    // 휴대폰 번호 정규화 테스트
    it('휴대폰 번호 정규화', () => {
      // 다양한 입력 형태와 예상 결과를 배열로 정의
      const cases = [
        ['01012345678', '010-1234-5678'], // 숫자만 있는 경우
        ['010 1234 5678', '010-1234-5678'], // 공백으로 구분된 경우
        ['010.1234.5678', '010-1234-5678'], // 점으로 구분된 경우
        ['010-1234-5678', '010-1234-5678'], // 이미 정규화된 형식
      ];

      // 각 케이스별로 테스트 실행
      cases.forEach(([input, expected]) => {
        // normalize 메소드를 호출하고 결과가 예상값과 일치하는지 확인
        expect(PhoneUtil.normalize(input)).toBe(expected);
      });
    });

    // 서울 지역번호(02) 정규화 테스트
    it('서울 지역번호 정규화', () => {
      const cases = [
        ['0212345678', '02-1234-5678'], // 10자리 숫자
        ['02 1234 5678', '02-1234-5678'], // 공백 구분
        ['02.1234.5678', '02-1234-5678'], // 점 구분
        ['02-1234-5678', '02-1234-5678'], // 이미 정규화됨
      ];

      cases.forEach(([input, expected]) => {
        expect(PhoneUtil.normalize(input)).toBe(expected);
      });
    });

    // 기타 지역번호들 정규화 테스트
    it('기타 지역번호 정규화', () => {
      const cases = [
        ['03112345678', '031-1234-5678'], // 경기도(031)
        ['05112345678', '051-1234-5678'], // 부산(051)
        ['06212345678', '062-1234-5678'], // 광주(062)
      ];

      cases.forEach(([input, expected]) => {
        expect(PhoneUtil.normalize(input)).toBe(expected);
      });
    });

    // 변환할 수 없는 형식은 원본 그대로 반환하는 테스트
    it('변환할 수 없는 형식은 원본 반환', () => {
      const cases = [
        '123', // 너무 짧은 번호
        '010123', // 불완전한 휴대폰 번호
        '1234567890123456', // 너무 긴 번호
        'invalid-phone', // 문자가 포함된 경우
      ];

      cases.forEach((input) => {
        // 변환할 수 없는 경우 입력값 그대로 반환
        expect(PhoneUtil.normalize(input)).toBe(input);
      });
    });
  });

  // isValid 메소드에 대한 테스트 그룹
  // 전화번호가 유효한 형식인지 검증하는 메소드
  describe('isValid', () => {
    // 유효한 전화번호들에 대한 검증 테스트
    it('유효한 전화번호 검증', () => {
      const validNumbers = [
        '010-1234-5678', // 표준 휴대폰 번호 형식
        '02-1234-5678', // 서울 지역번호 형식
        '031-1234-5678', // 경기도 지역번호 형식
        '051-1234-5678', // 부산 지역번호 형식
        '010 1234 5678', // 공백 구분 (내부에서 정규화 후 검증)
        '01012345678', // 숫자만 (내부에서 정규화 후 검증)
      ];

      validNumbers.forEach((number) => {
        // 모든 유효한 번호들이 true를 반환하는지 확인
        expect(PhoneUtil.isValid(number)).toBe(true);
      });
    });

    // 잘못된 전화번호들에 대한 검증 테스트
    it('잘못된 전화번호 검증', () => {
      const invalidNumbers = [
        '010-123-5678', // 중간 번호가 3자리 (4자리여야 함)
        '010-12345-678', // 뒷번호가 3자리 (4자리여야 함)
        '02-123-5678', // 서울 번호의 중간이 3자리
        '999-1234-5678', // 존재하지 않는 지역번호
        '010-1234-567', // 뒷번호가 3자리
        '123', // 너무 짧음
        '', // 빈 문자열
        'invalid', // 완전히 잘못된 형식
      ];

      invalidNumbers.forEach((number) => {
        // 모든 잘못된 번호들이 false를 반환하는지 확인
        expect(PhoneUtil.isValid(number)).toBe(false);
      });
    });
  });

  // mask 메소드에 대한 테스트 그룹
  // 개인정보 보호를 위해 전화번호 중간 부분을 '*'로 마스킹
  describe('mask', () => {
    // 휴대폰 번호 마스킹 테스트
    it('휴대폰 번호 마스킹', () => {
      const cases = [
        ['010-1234-5678', '010-****-5678'], // 표준 형식
        ['010 1234 5678', '010-****-5678'], // 공백 구분 (정규화 후 마스킹)
        ['01012345678', '010-****-5678'], // 숫자만 (정규화 후 마스킹)
      ];

      cases.forEach(([input, expected]) => {
        expect(PhoneUtil.mask(input)).toBe(expected);
      });
    });

    // 서울 지역번호 마스킹 테스트
    it('서울 지역번호 마스킹', () => {
      const cases = [
        ['02-1234-5678', '02-****-5678'], // 표준 형식
        ['02 1234 5678', '02-****-5678'], // 공백 구분
        ['0212345678', '02-****-5678'], // 숫자만
      ];

      cases.forEach(([input, expected]) => {
        expect(PhoneUtil.mask(input)).toBe(expected);
      });
    });

    // 기타 지역번호 마스킹 테스트
    it('기타 지역번호 마스킹', () => {
      const cases = [
        ['031-1234-5678', '031-****-5678'], // 경기도
        ['051-1234-5678', '051-****-5678'], // 부산
      ];

      cases.forEach(([input, expected]) => {
        expect(PhoneUtil.mask(input)).toBe(expected);
      });
    });

    // 마스킹할 수 없는 형식은 원본 반환 테스트
    it('마스킹할 수 없는 형식은 원본 반환', () => {
      const invalidNumbers = ['123', 'invalid', '010-123'];

      invalidNumbers.forEach((number) => {
        // 마스킹할 수 없는 형식은 입력값 그대로 반환
        expect(PhoneUtil.mask(number)).toBe(number);
      });
    });
  });

  // removeHyphen 메소드에 대한 테스트 그룹
  // 전화번호에서 하이픈(-) 문자를 모두 제거하는 메소드
  describe('removeHyphen', () => {
    // 다양한 형태의 하이픈 제거 테스트
    it('하이픈 제거', () => {
      const cases = [
        ['010-1234-5678', '01012345678'], // 휴대폰 번호
        ['02-1234-5678', '0212345678'], // 서울 번호
        ['031-1234-5678', '03112345678'], // 지역번호
        ['no-hyphen', 'nohyphen'], // 일반 문자열
        ['010-1234-5678-extra', '010123456789extra'], // 여러 하이픈
      ];

      cases.forEach(([input, expected]) => {
        expect(PhoneUtil.removeHyphen(input)).toBe(expected);
      });
    });
  });
});
