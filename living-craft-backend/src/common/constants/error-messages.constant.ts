/**
 * 에러 메시지 중앙 관리 상수
 *
 * 사용법:
 * - DTO: @IsString({ message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.email) })
 * - Service: throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
 *
 * 톤앤매너: 존댓말 ("~합니다", "~해야 합니다", "~하세요")
 */

export const ERROR_MESSAGES = {
  // ============================================
  // 1. Validation 에러 (class-validator)
  // ============================================
  VALIDATION: {
    // 타입 검증
    IS_STRING: (field: string) => `${field}는 문자열이어야 합니다.`,
    IS_NUMBER: (field: string) => `${field}는 숫자여야 합니다.`,
    IS_BOOLEAN: (field: string) => `${field}는 참/거짓 값이어야 합니다.`,
    IS_ARRAY: (field: string) => `${field}는 배열이어야 합니다.`,
    IS_EMAIL: '올바른 이메일 형식이 아닙니다.',
    IS_DATE: (field: string) => `${field}는 올바른 날짜 형식이어야 합니다.`,
    IS_UUID: (field: string) => `${field}는 올바른 UUID 형식이어야 합니다.`,

    // 필수 여부
    IS_NOT_EMPTY: (field: string) => `${field}는 필수 항목입니다.`,

    // 길이 제한
    MAX_LENGTH: (field: string, max: number) =>
      `${field}는 ${max}자를 초과할 수 없습니다.`,
    MIN_LENGTH: (field: string, min: number) =>
      `${field}는 최소 ${min}자 이상이어야 합니다.`,

    // 숫자 범위
    MIN: (field: string, min: number) => `${field}는 ${min} 이상이어야 합니다.`,
    MAX: (field: string, max: number) => `${field}는 ${max} 이하여야 합니다.`,

    // 패턴 매칭
    DATE_FORMAT: (field: string) => `${field}의 형식은 YYYY-MM-DD여야 합니다.`,
    TIME_FORMAT: (field: string) => `${field}의 형식은 HH:mm이어야 합니다.`,
    PHONE_FORMAT: '올바른 전화번호 형식이 아닙니다.',
    USERNAME_FORMAT:
      '사용자명은 소문자, 숫자, 점(.), 언더스코어(_), 하이픈(-)만 사용할 수 있습니다.',
    INVALID_DATE_FORMAT: '날짜 형식은 YYYY-MM-DD여야 합니다.',
    INVALID_TIME_FORMAT: '시간 형식은 HH:mm이어야 합니다.',
    INVALID_COLOR_FORMAT: '색상 형식은 #RRGGBB여야 합니다.',

    // 배열
    ARRAY_NOT_EMPTY: (field: string) =>
      `${field}는 최소 1개 이상의 항목이 필요합니다.`,
    ARRAY_ITEM_STRING: (field: string) =>
      `${field}의 각 항목은 문자열이어야 합니다.`,
    ARRAY_ITEM_NUMBER: (field: string) =>
      `${field}의 각 항목은 숫자여야 합니다.`,

    // Enum
    INVALID_ENUM: (field: string, values: string) =>
      `${field}는 다음 값 중 하나여야 합니다: ${values}`,

    // Nested
    NESTED_VALIDATION: (field: string) =>
      `${field}의 하위 데이터가 유효하지 않습니다.`,
  },

  // ============================================
  // 2. 비즈니스 로직 에러 (도메인별)
  // ============================================

  // 인증/인가
  AUTH: {
    INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
    ACCOUNT_INACTIVE: '비활성화된 계정입니다. 관리자에게 문의하세요.',
    UNAUTHORIZED: '인증이 필요합니다.',
    UNAUTHORIZED_USER: '인증되지 않은 사용자입니다.',
    FORBIDDEN: '접근 권한이 없습니다.',
    TOKEN_EXPIRED: '토큰이 만료되었습니다. 다시 로그인해주세요.',
    INVALID_TOKEN: '유효하지 않은 토큰입니다.',
    INVALID_REFRESH_TOKEN: '유효하지 않은 Refresh Token입니다.',
    TOKEN_REFRESH_FAILED: '토큰 갱신에 실패했습니다.',
  },

  // 예약
  RESERVATION: {
    NOT_FOUND: '예약을 찾을 수 없습니다.',
    FORBIDDEN_ACCESS: '본인의 예약만 조회할 수 있습니다.',
    FORBIDDEN_CANCEL: '본인의 예약만 취소할 수 있습니다.',
    ALREADY_CANCELLED: '이미 취소된 예약입니다.',
    CANNOT_CANCEL_COMPLETED: '완료된 예약은 취소할 수 없습니다.',
    INVALID_SERVICE: '유효하지 않은 서비스입니다.',
  },

  // 서비스
  SERVICE: {
    NOT_FOUND: '서비스를 찾을 수 없습니다.',
    ALREADY_EXISTS: '이미 존재하는 서비스입니다.',
    INACTIVE: '비활성화된 서비스입니다.',
    INVALID_ICON_ID: '존재하지 않는 아이콘 ID입니다.',
    ICON_NOT_FOUND: (iconName: string) =>
      `아이콘을 찾을 수 없습니다: ${iconName}`,
  },

  // 포트폴리오
  PORTFOLIO: {
    NOT_FOUND: '포트폴리오를 찾을 수 없습니다.',
  },

  // 리뷰
  REVIEW: {
    NOT_FOUND: '리뷰를 찾을 수 없습니다.',
    ALREADY_REVIEWED: '이미 리뷰를 작성한 예약입니다.',
    UNAUTHORIZED_DELETE: '본인의 리뷰만 삭제할 수 있습니다.',
    FORBIDDEN_CREATE: '본인의 예약에만 리뷰를 작성할 수 있습니다.',
    ONLY_COMPLETED_RESERVATION: '완료된 예약에만 리뷰를 작성할 수 있습니다.',
  },

  // 고객
  CUSTOMER: {
    NOT_FOUND: '고객을 찾을 수 없습니다.',
    EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
  },

  // 관리자 사용자
  USER: {
    NOT_FOUND: '사용자를 찾을 수 없습니다.',
    EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
    USERNAME_ALREADY_EXISTS: '이미 사용 중인 사용자명입니다.',
    INVALID_PASSWORD: '비밀번호가 올바르지 않습니다.',
  },

  // 설정
  SETTINGS: {
    HOLIDAY_ALREADY_EXISTS: '이미 등록된 휴무일입니다.',
    HOLIDAY_NOT_FOUND: '해당 휴무일을 찾을 수 없습니다.',
  },

  // 파일 업로드
  FILES: {
    NOT_SELECTED: '파일이 선택되지 않았습니다.',
    UNSUPPORTED_TYPE: '지원하지 않는 파일 형식입니다.',
    IMAGE_ONLY: '이미지 파일만 업로드 가능합니다.',
    IMAGE_PROCESSING_ERROR: '이미지 처리 중 오류가 발생했습니다.',
    UNSUPPORTED_DOCUMENT_TYPE: '지원되지 않는 문서 파일 형식입니다.',
    UNSUPPORTED_DOCUMENT_FORMAT:
      '지원되지 않는 문서 형식입니다. 지원 형식: PDF, DOC, DOCX, HWP, TXT',
    DOCUMENT_SAVE_ERROR: (message: string) =>
      `문서 파일 저장 중 오류가 발생했습니다: ${message}`,
    DOCUMENT_UPLOAD_ERROR: (message: string) =>
      `문서 업로드 중 오류가 발생했습니다: ${message}`,
  },

  // ============================================
  // 3. 시스템 에러
  // ============================================
  SYSTEM: {
    UNEXPECTED_FIELD: (field: string) =>
      `'${field}'는 허용되지 않는 필드입니다.`,
    VALIDATION_FAILED: '입력 데이터가 유효하지 않습니다.',
    INTERNAL_ERROR: '서버 내부 오류가 발생했습니다.',
    DATABASE_ERROR: '데이터베이스 오류가 발생했습니다.',
  },
};

/**
 * 필드명 한글 매핑
 *
 * 사용법:
 * - ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.email)
 * - "email는 문자열이어야 합니다." 가 아니라
 * - "이메일는 문자열이어야 합니다." 로 표시됨
 */
export const FIELD_NAMES = {
  // ID 필드
  id: 'ID',
  serviceId: '서비스 ID',
  customerId: '고객 ID',
  reservationId: '예약 ID',
  portfolioId: '포트폴리오 ID',
  userId: '사용자 ID',
  reviewId: '리뷰 ID',

  // 날짜/시간
  estimateDate: '견적 날짜',
  estimateTime: '견적 시간',
  constructionDate: '시공 날짜',
  constructionTime: '시공 시간',
  startTime: '시작 시간',
  endTime: '종료 시간',
  slotDuration: '시간 간격',
  availableDays: '운영 요일',

  // 주소
  address: '주소',
  detailAddress: '상세 주소',

  // 고객 정보
  customerName: '고객 이름',
  customerPhone: '고객 전화번호',

  // 사용자 정보
  firstName: '이름',
  lastName: '성',
  username: '사용자명',
  email: '이메일',
  password: '비밀번호',
  phoneNumber: '전화번호',

  // 서비스
  title: '제목',
  description: '설명',
  duration: '소요 시간',
  iconName: '아이콘 이름',
  iconBgColor: '배경색',
  iconColor: '아이콘 색상',
  requiresTimeSelection: '시간 선택 필요 여부',

  // 리뷰
  rating: '평점',
  comment: '리뷰 내용',

  // 포트폴리오
  category: '카테고리',
  imageUrls: '이미지 URL',

  // 기타
  name: '이름',
  memo: '메모',
  photos: '사진',
  status: '상태',
  role: '역할',
  limit: '조회 개수',
  offset: '조회 시작 위치',
  page: '페이지',
  sortBy: '정렬 기준',
  sortOrder: '정렬 순서',

  // 운영 설정
  operatingType: '운영 타입',
  date: '날짜',
  reason: '사유',

  // 지역
  districtId: '지역 ID',
  districtName: '지역명',
  cityName: '시/군/구',
  baseCost: '기본 비용',
};
