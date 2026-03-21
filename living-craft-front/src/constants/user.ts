// 사용자 및 메뉴 관련 상수
// pages/my/index.tsx에서 사용

export interface MenuItem {
  iconName: string;
  title: string;
  subtitle: string;
  path: string;
  badge?: number;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    iconName: 'icon-calendar-3-blue',
    title: '내 예약',
    subtitle: '예약 내역을 확인하세요',
    path: '/my/reservations',
  },
  {
    iconName: 'icon-chat-bubble-dots-skyblue',
    title: '내 리뷰',
    subtitle: '작성한 리뷰를 확인하세요',
    path: '/my/reviews',
  },
];
