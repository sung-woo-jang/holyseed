/**
 * 회사 정보 및 Footer 관련 상수
 * widgets/layouts/public-layout/ui/Footer.tsx 등에서 사용
 */

export const COMPANY_INFO = {
  // 회사 기본 정보
  name: 'Living Craft',
  description: '생활 서비스 전문',
  businessNumber: '123-45-67890',
  representative: '홍길동',
  address: '서울특별시 강남구 테헤란로 123',

  // 연락처
  contact: {
    phone: '02-1234-5678',
    email: 'contact@livingcraft.com',
    businessHours: '평일 09:00 - 18:00',
  },

  // SNS 링크
  sns: {
    instagram: 'https://instagram.com/livingcraft',
    blog: 'https://blog.naver.com/livingcraft',
    kakao: 'http://pf.kakao.com/_livingcraft',
  },

  // 법적 문서
  legal: {
    privacy: '/legal/privacy',
    terms: '/legal/terms',
  },

  // 앱 정보
  version: '1.0.0',
  copyright: '© 2024 Living Craft. All rights reserved.',
} as const;
