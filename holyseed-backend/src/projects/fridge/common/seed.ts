import { FridgePlace } from '../entities';
import { addDays } from './date.util';

export const PERSON_PALETTE = ['#f0a53a', 'oklch(0.8 0.09 255)', 'oklch(0.8 0.09 300)', 'oklch(0.83 0.09 355)', 'oklch(0.86 0.1 110)'];

export const DEFAULT_FREQ: { name: string; place: FridgePlace; days: number }[] = [
  { name: '우유', place: '냉장', days: 7 },
  { name: '계란', place: '냉장', days: 21 },
  { name: '두부', place: '냉장', days: 5 },
  { name: '대파', place: '냉장', days: 7 },
  { name: '양파', place: '실온', days: 30 },
  { name: '요거트', place: '냉장', days: 10 },
  { name: '식빵', place: '실온', days: 4 },
  { name: '만두', place: '냉동', days: 90 },
  { name: '키친타월', place: '실온', days: 365 },
  { name: '바나나', place: '실온', days: 5 },
];

/** "샘플 초기화"용 예시 데이터 — 날짜는 오늘 기준 상대값 */
export const buildSample = (today: string) => ({
  ingredients: [
    ['요거트', '냉장', -1],
    ['우유', '냉장', 1],
    ['두부', '냉장', 2],
    ['대파', '냉장', 3],
    ['계란', '냉장', 9],
    ['만두', '냉동', 45],
    ['김치', '냉장', 60],
    ['양파', '실온', 20],
  ].map(([name, place, d]) => ({ name: name as string, place: place as FridgePlace, exp: addDays(today, d as number) })),
  shop: [
    { name: '식빵', done: false },
    { name: '새우', done: false },
    { name: '바나나', done: true },
    { name: '키친타월', done: false },
  ],
  events: [
    [-8, '11:00', '세차', 'none'],
    [-1, '19:00', '요가', 'none'],
    [-5, '21:00', '분리수거', 'weekly'],
    [0, '09:30', '스터디', 'none'],
    [0, '12:30', '점심 약속', 'none'],
    [0, '20:00', '장보기', 'none'],
    [1, '', '엄마 생신', 'none'],
    [1, '14:00', '미팅 준비', 'none'],
    [2, '10:00', '치과', 'none'],
    [3, '19:00', '친구 저녁', 'none'],
    [5, '', '캠핑', 'none'],
    [12, '15:00', '이사 견적', 'none'],
    [20, '', '여행', 'none'],
  ].map(([d, time, title, repeat]) => ({
    date: addDays(today, d as number),
    time: time as string,
    title: title as string,
    repeat: repeat as 'none' | 'weekly',
  })),
});
