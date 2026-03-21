// 서비스 쇼케이스 이미지 데이터

export interface FilmShowcaseImage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const getFilmImageUrl = (id: number) => `https://picsum.photos/seed/film-${id}/800/600`;

export const FILM_SHOWCASE_IMAGES: FilmShowcaseImage[] = [
  {
    id: '1',
    title: '주방 싱크대 필름 작업',
    description: '낡은 싱크대가 새것처럼',
    imageUrl: getFilmImageUrl(101),
  },
  {
    id: '2',
    title: '거실 가구 필름 작업',
    description: '원목 패턴으로 따뜻한 분위기',
    imageUrl: getFilmImageUrl(102),
  },
  {
    id: '3',
    title: '문틀 필름 작업',
    description: '대리석 패턴으로 고급스럽게',
    imageUrl: getFilmImageUrl(103),
  },
  {
    id: '4',
    title: '욕실 타일 필름',
    description: '방수 필름으로 깨끗하게',
    imageUrl: getFilmImageUrl(104),
  },
];
