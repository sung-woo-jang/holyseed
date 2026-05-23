import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { Category } from '../modules/catalog/entities/category.entity';
import { ServiceItem } from '../modules/catalog/entities/service-item.entity';
import { ProductGroup } from '../modules/catalog/entities/product-group.entity';
import { Product } from '../modules/catalog/entities/product.entity';
import { ProductFeature } from '../modules/catalog/entities/product-feature.entity';
import { ProductColor } from '../modules/catalog/entities/product-color.entity';
import { Case } from '../modules/cases/entities/case.entity';
import { CaseTag } from '../modules/cases/entities/case-tag.entity';
import { CasePhoto } from '../modules/cases/entities/case-photo.entity';
import { Job } from '../modules/jobs/entities/job.entity';
import { JobPhoto } from '../modules/jobs/entities/job-photo.entity';
import { TechSchedule } from '../modules/schedule/entities/tech-schedule.entity';
import { JipUser } from '../modules/auth/entities/jip-user.entity';
import { QuoteRequest } from '../modules/requests/entities/quote-request.entity';
import { QuoteRequestItem } from '../modules/requests/entities/quote-request-item.entity';
import { QuoteRequestPhoto } from '../modules/requests/entities/quote-request-photo.entity';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// ===== 원본 데이터 =====

const CATALOG_DATA = [
  {
    code: 'kitchen', name: '주방', color: 'warm', sortOrder: 1,
    intro: '수전·싱크볼·상판처럼 매일 쓰는 곳일수록 깔끔하게.',
    items: [
      { code: 'k1', name: '상판 교체', price: 250000, unit: '인조대리석 기준', duration: '4시간', description: '오래된 상판을 새 인조대리석으로 교체합니다. 색상 선택 가능.', isFeatured: false },
      { code: 'k2', name: '상판 샌딩 복원', price: 120000, unit: '1m 기준', duration: '2시간', description: '교체 없이 표면 흠집과 얼룩을 갈아내어 새것처럼 복원.', isFeatured: false },
      { code: 'k3', name: '싱크볼 교체', price: 80000, unit: '실리콘·자재 포함', duration: '2시간', description: '낡거나 찌그러진 싱크볼을 깨끗한 새것으로.', isFeatured: false },
      { code: 'k4', name: '주방 수전 교체', price: 50000, unit: '자재 별도', duration: '40분', description: '누수·녹·디자인 교체. 원홀/투홀 모두 가능.', isFeatured: true },
      { code: 'k5', name: '문짝 교체', price: 60000, unit: '장당', duration: '1시간/장', description: '경첩과 함께 신규 문짝으로 교체.', isFeatured: false },
      { code: 'k6', name: '경첩 교체', price: 15000, unit: '개당', duration: '20분/개', description: '뻑뻑하거나 처진 경첩 교체.', isFeatured: false },
    ],
  },
  {
    code: 'bath', name: '화장실', color: 'cool', sortOrder: 2,
    intro: '물 새고 흔들리는 것, 그날 안에 끝냅니다.',
    items: [
      { code: 'b1', name: '화장실 수전 교체', price: 50000, unit: '자재 별도', duration: '40분', description: '세면대·샤워 겸용 수전 모두 가능.', isFeatured: true },
      { code: 'b2', name: '세면대 교체', price: 120000, unit: '실리콘·자재 포함', duration: '2.5시간', description: '폴대 포함 일체형 교체.', isFeatured: false },
      { code: 'b3', name: '변기 교체', price: 150000, unit: '자재 별도', duration: '2시간', description: '구형 변기를 절수형 새 변기로 교체.', isFeatured: false },
      { code: 'b4', name: '비데 설치', price: 60000, unit: '본체 별도', duration: '30분', description: '전기·수도 연결까지 한번에.', isFeatured: false },
      { code: 'b5', name: '수건걸이 / 액세서리', price: 25000, unit: '개당', duration: '20분', description: '못자국 없이 깔끔한 마감.', isFeatured: false },
      { code: 'b6', name: '샤워기 슬라이드바', price: 60000, unit: '자재 별도', duration: '40분', description: '높이 조절 가능한 슬라이드바 설치.', isFeatured: false },
      { code: 'b7', name: '수납장 설치', price: 80000, unit: '자재 별도', duration: '1시간', description: '거울·수납장 등 벽 부착.', isFeatured: false },
    ],
  },
  {
    code: 'film', name: '인테리어 필름', color: 'default', sortOrder: 3,
    intro: '문·벽·몰딩 색만 바꿔도 집이 달라집니다.',
    items: [
      { code: 'f1', name: '문 필름 시공', price: 80000, unit: '장당', duration: '2시간/장', description: '국산 LG/현대 필름으로 정성스럽게 시공.', isFeatured: false },
      { code: 'f2', name: '벽면 필름 시공', price: 30000, unit: '㎡', duration: '면적에 따름', description: '거실·주방 포인트 벽 시공.', isFeatured: false },
      { code: 'f3', name: '몰딩 필름 시공', price: 40000, unit: 'm', duration: '면적에 따름', description: '천장·바닥 몰딩 색 바꾸기.', isFeatured: false },
    ],
  },
  {
    code: 'floor', name: '마루 복원', color: 'warm', sortOrder: 4,
    intro: '교체 없이도 마루가 다시 살아납니다.',
    items: [
      { code: 'fl1', name: '긁힘·찍힘 보수', price: 60000, unit: '회', duration: '1시간', description: '눈에 띄는 흠집을 자연스럽게 보수.', isFeatured: true },
      { code: 'fl2', name: '마루 부분 교체', price: 120000, unit: '㎡', duration: '면적에 따름', description: '심한 손상 부위만 부분 교체.', isFeatured: false },
      { code: 'fl3', name: '마루 왁싱', price: 80000, unit: '10㎡', duration: '1시간/10㎡', description: '광택·발수력 복원.', isFeatured: false },
    ],
  },
];

const PRODUCTS_DATA: Record<string, {
  note: string;
  groups: {
    code: string; label: string; description?: string;
    items: { code: string; brand: string; name: string; spec: string; price: number; illust: string; description: string; features: string[]; colors: string[] }[];
  }[];
}> = {
  k4: {
    note: '제품은 별도 자재비입니다. 선택은 참고용이고, 시공 시 협의해서 최종 확정해요.',
    groups: [
      { code: 'one', label: '원홀', description: '구멍 1개, 가장 일반적', items: [
        { code: 'k4-1', brand: 'AQUA', name: '베이직 원홀', spec: '크롬 / 토출 고정', price: 45000, illust: 'faucet', description: '가장 일반적인 원홀 수전. 무난한 디자인과 안정적인 품질로 가장 많이 선택해요.', features: ['스테인리스 304 본체', '세라믹 카트리지', '국내 A/S 1년'], colors: ['크롬'] },
        { code: 'k4-2', brand: 'AQUA', name: '풀아웃 원홀', spec: '무광 / 호스 인출', price: 62000, illust: 'faucet', description: '토출구를 빼서 쓸 수 있는 호스 타입. 큰 냄비 헹굼이 편하고, 무광 마감으로 지문이 덜 묻어요.', features: ['호스 인출 1m', '무광 마감', '두 가지 분사 모드'], colors: ['무광 크롬', '무광 블랙'] },
        { code: 'k4-3', brand: 'DELTA', name: '센서 원홀', spec: '터치리스 작동', price: 125000, illust: 'faucet', description: '손을 갖다 대면 물이 나오는 터치리스 수전. 요리 중에도 깨끗하게 쓸 수 있어요.', features: ['IR 센서', '온도 메모리', '배터리 6개월'], colors: ['크롬'] },
      ]},
      { code: 'two', label: '투홀', description: '구멍 2개, 온냉 분리', items: [
        { code: 'k4-4', brand: 'AQUA', name: '베이직 투홀', spec: '크롬', price: 52000, illust: 'faucet', description: '온수·냉수가 분리된 구식 싱크대에 맞는 투홀 타입. 기존 구멍 그대로 교체할 수 있어요.', features: ['투홀 표준 규격', '세라믹 카트리지', '국내 A/S 1년'], colors: ['크롬'] },
        { code: 'k4-5', brand: 'AQUA', name: '브러시드 골드', spec: '브러시드 골드', price: 71000, illust: 'faucet', description: '브러시드 골드 마감으로 클래식한 분위기를 만들어요. 우드톤 주방과 잘 어울려요.', features: ['브러시드 골드 마감', '내부식 코팅', '세라믹 카트리지'], colors: ['브러시드 골드'] },
      ]},
      { code: 'prem', label: '프리미엄', description: '브랜드 · 고급형', items: [
        { code: 'k4-6', brand: 'ROCA', name: '프리미엄 풀아웃', spec: '원홀 / 풀아웃', price: 89000, illust: 'faucet', description: '스페인 ROCA의 프리미엄 라인. 묵직한 손맛과 견고한 마감, 디자인까지 모두 챙겼어요.', features: ['ROCA 정품', '두꺼운 본체', '5년 보증'], colors: ['크롬', '무광 블랙'] },
      ]},
    ],
  },
  b1: {
    note: '제품은 별도 자재비입니다.',
    groups: [
      { code: 'basic', label: '세면대 전용', items: [
        { code: 'b1-1', brand: 'AQUA', name: '기본형', spec: '크롬', price: 42000, illust: 'faucet', description: '깔끔한 디자인의 기본형 세면대 수전. 어떤 욕실에도 무난하게 어울려요.', features: ['크롬 도금', '세라믹 카트리지', '국내 A/S 1년'], colors: ['크롬'] },
        { code: 'b1-2', brand: 'AQUA', name: '무광형', spec: '무광 블랙', price: 55000, illust: 'faucet', description: '무광 블랙 마감의 모던한 디자인. 화이트 타일·우드 톤과 잘 어울려요.', features: ['무광 분체도장', '내지문 코팅', '세라믹 카트리지'], colors: ['무광 블랙'] },
      ]},
      { code: 'shower', label: '샤워 겸용', items: [
        { code: 'b1-3', brand: 'ROCA', name: '핸드샤워 겸용', spec: '핸드샤워 포함', price: 68000, illust: 'shower', description: '세면대와 핸드샤워를 함께 쓸 수 있는 겸용 타입. 청소할 때도 편해요.', features: ['핸드샤워 포함', '호스 1.5m', '5년 보증'], colors: ['크롬'] },
      ]},
    ],
  },
  b2: {
    note: '세면대 본체 자재비입니다. 폴대·실리콘 포함.',
    groups: [
      { code: 'top', label: '탑카운터', description: '상판 위에 올라가는 타입', items: [
        { code: 'b2-1', brand: 'CERAM', name: '라운드 탑', spec: '50cm', price: 95000, illust: 'sink', description: '둥근 디자인의 50cm 탑카운터 세면대. 좁은 화장실에도 잘 맞아요.', features: ['도자기 본체', '오버플로우 홀', '폴대 포함'], colors: ['화이트'] },
        { code: 'b2-2', brand: 'CERAM', name: '스퀘어 탑', spec: '55cm', price: 110000, illust: 'sink', description: '각진 디자인으로 모던한 분위기. 욕실을 한층 깔끔하게 만들어요.', features: ['도자기 본체', '오버플로우 홀', '폴대 포함'], colors: ['화이트'] },
      ]},
      { code: 'under', label: '언더카운터', description: '상판 아래 결합, 깔끔', items: [
        { code: 'b2-3', brand: 'BLANCO', name: '언더마운트', spec: '54cm', price: 145000, illust: 'sink', description: '상판 아래로 결합되어 가장자리가 깔끔. 청소가 쉽고 호텔 느낌이 나요.', features: ['도자기 본체', '언더카운터 전용', '브라켓 포함'], colors: ['화이트'] },
      ]},
    ],
  },
  b3: {
    note: '변기 본체 자재비입니다.',
    groups: [
      { code: 'basic', label: '일반형', items: [
        { code: 'b3-1', brand: 'CERAM', name: '베이직 양변기', spec: '절수 / 화이트', price: 130000, illust: 'toilet', description: '튼튼한 절수형 양변기. 물 절약형으로 수도 요금도 줄여줘요.', features: ['듀얼 절수 6L/4L', '도자기 본체', 'A/S 2년'], colors: ['화이트'] },
      ]},
      { code: 'one-piece', label: '일체형', description: '본체와 물탱크가 한 덩어리', items: [
        { code: 'b3-2', brand: 'TOTO', name: '일체형 변기', spec: '저소음 / 절수', price: 220000, illust: 'toilet', description: 'TOTO의 저소음 일체형. 물 내림 소리가 작고 디자인이 매끈해요.', features: ['일체형 본체', '저소음 시스템', '절수형'], colors: ['화이트'] },
      ]},
    ],
  },
  k3: {
    note: '싱크볼 자재비입니다.',
    groups: [
      { code: 'top', label: '탑마운트', description: '상판 위로 올라오는 일반 타입', items: [
        { code: 'k3-1', brand: 'SWAN', name: '스테인리스', spec: '50×40cm', price: 70000, illust: 'sink', description: '내구성 좋은 스테인리스 304. 가장 일반적인 사이즈로 어떤 주방에도 맞아요.', features: ['스테인리스 304', '방음 코팅', '배수구 포함'], colors: ['스테인리스'] },
        { code: 'k3-2', brand: 'SWAN', name: '대형 스테인리스', spec: '60×45cm', price: 95000, illust: 'sink', description: '넓은 작업 공간을 원할 때. 큰 냄비도 여유롭게 들어가요.', features: ['스테인리스 304', '방음 코팅', '대형 사이즈'], colors: ['스테인리스'] },
      ]},
      { code: 'under', label: '언더카운터', description: '상판 아래 결합', items: [
        { code: 'k3-3', brand: 'BLANCO', name: '언더마운트', spec: '54×44cm', price: 120000, illust: 'sink', description: '상판 아래로 결합되어 가장자리가 깔끔. 청소가 정말 편해요.', features: ['스테인리스 304', '언더마운트', '브라켓 포함'], colors: ['스테인리스'] },
      ]},
    ],
  },
  k1: {
    note: '상판 자재비입니다. 색상은 시공 시 상의해서 정해요.',
    groups: [
      { code: 'man', label: '인조대리석', items: [
        { code: 'k1-1', brand: 'LX', name: '하이마카', spec: '20T / 컬러 다양', price: 220000, illust: 'counter', description: 'LG 하우시스의 대표 인조대리석. 색상 선택이 다양하고 관리가 쉬워요.', features: ['두께 20T', '50+ 색상', '오염 강함'], colors: ['아이보리', '화이트', '베이지'] },
        { code: 'k1-2', brand: 'LX', name: '하이그로시', spec: '광택 마감', price: 260000, illust: 'counter', description: '광택 마감으로 고급스러운 분위기. 빛 반사로 주방이 한층 밝아 보여요.', features: ['하이그로시 마감', '두께 20T', '오염 강함'], colors: ['화이트', '블랙', '그레이'] },
      ]},
      { code: 'real', label: '천연석', description: '대리석/화강암', items: [
        { code: 'k1-3', brand: 'NAT', name: '천연 대리석', spec: '20T', price: 380000, illust: 'counter', description: '천연석 특유의 무늬와 묵직한 질감. 인조대리석보다 한 단계 위.', features: ['천연 대리석', '두께 20T', '광택 시공'], colors: ['카라라', '베이지', '그레이'] },
      ]},
    ],
  },
  b6: {
    note: '제품 자재비입니다.',
    groups: [
      { code: 'stk', label: '스테인리스', items: [
        { code: 'b6-1', brand: 'STK', name: '60cm 슬라이드바', spec: '스테인리스', price: 35000, illust: 'shower', description: '깔끔한 스테인리스 마감의 60cm 슬라이드바. 어떤 욕실에도 무난해요.', features: ['스테인리스 304', '높이 조절', '핸드샤워 호환'], colors: ['크롬'] },
      ]},
      { code: 'brass', label: '브라스', description: '골드 색감', items: [
        { code: 'b6-2', brand: 'BRASS', name: '60cm 골드', spec: '브라스 골드', price: 58000, illust: 'shower', description: '따뜻한 골드톤의 브라스 슬라이드바. 화장실 분위기를 확 바꿔줘요.', features: ['브라스 본체', '골드 도금', '높이 조절'], colors: ['브러시드 골드'] },
      ]},
    ],
  },
  f1: {
    note: '필름 자재비입니다. 색상·패턴은 샘플북에서 선택해요.',
    groups: [
      { code: 'wood', label: '우드', items: [
        { code: 'f1-1', brand: 'LG', name: '내추럴 오크', spec: '국산 LG', price: 22000, illust: 'door', description: '자연스러운 오크 결의 필름. 거실 문이나 안방 문에 잘 어울려요.', features: ['국산 LG 정품', '내스크래치', '10년 보증'], colors: ['내추럴 오크'] },
        { code: 'f1-2', brand: 'LG', name: '월넛 다크', spec: '국산 LG', price: 24000, illust: 'door', description: '어두운 월넛 톤으로 차분한 분위기. 모던한 인테리어에 잘 맞아요.', features: ['국산 LG 정품', '내스크래치', '10년 보증'], colors: ['월넛 다크'] },
      ]},
      { code: 'solid', label: '솔리드', description: '단색 무광', items: [
        { code: 'f1-3', brand: 'HYUNDAI', name: '솔리드 화이트', spec: '무광', price: 20000, illust: 'door', description: '깔끔한 무광 화이트. 가장 무난하면서도 공간을 밝혀줘요.', features: ['현대L&C', '무광 마감', '5년 보증'], colors: ['화이트'] },
        { code: 'f1-4', brand: 'HYUNDAI', name: '솔리드 그레이', spec: '무광', price: 20000, illust: 'door', description: '차분한 무광 그레이. 모던하고 세련된 분위기로 만들어줘요.', features: ['현대L&C', '무광 마감', '5년 보증'], colors: ['라이트 그레이', '다크 그레이'] },
      ]},
    ],
  },
};

const CASES_DATA = [
  { title: '40년 된 주방, 상판·싱크볼·수전 한 번에', area: '서초구 반포동', hours: 4, dateText: '2026.03', tags: ['주방', '상판', '싱크볼'], color: 'warm', sortOrder: 1 },
  { title: '욕실 수전·세면대 교체로 호텔처럼', area: '강남구 역삼동', hours: 3, dateText: '2026.03', tags: ['화장실', '세면대'], color: 'cool', sortOrder: 2 },
  { title: '거실 문 인테리어 필름 시공', area: '동작구 사당동', hours: 6, dateText: '2026.02', tags: ['필름', '문'], color: 'default', sortOrder: 3 },
  { title: '강아지가 긁어 놓은 마루 복원', area: '마포구 망원동', hours: 2, dateText: '2026.02', tags: ['마루'], color: 'warm', sortOrder: 4 },
  { title: '오래된 주방 문짝 12장 전체 교체', area: '서초구 잠원동', hours: 5, dateText: '2026.01', tags: ['주방', '문짝'], color: 'warm', sortOrder: 5 },
  { title: '비데 + 슬라이드바 + 수납장', area: '강남구 청담동', hours: 2, dateText: '2026.01', tags: ['화장실'], color: 'cool', sortOrder: 6 },
  { title: '주방 상판 샌딩으로 새것처럼', area: '용산구 한남동', hours: 2, dateText: '2025.12', tags: ['주방', '상판'], color: 'warm', sortOrder: 7 },
  { title: '안방 문 + 몰딩 동시 시공', area: '성동구 성수동', hours: 4, dateText: '2025.12', tags: ['필름'], color: 'default', sortOrder: 8 },
  { title: '거실 마루 부분 교체 + 왁싱', area: '송파구 잠실동', hours: 5, dateText: '2025.11', tags: ['마루'], color: 'warm', sortOrder: 9 },
];

const SAMPLE_JOBS_DATA = [
  {
    id: 'k7n8f3x29azqp1mq4ld5xy0v',
    isPublished: true,
    customerName: '정수아', phone: '010-3324-7791',
    addressFull: '서울 강남구 역삼동 738-12 한솔빌라 302호', addressShort: '강남구 역삼동',
    inquiryDate: '2026-04-28', workDate: '2026-04-30', status: '시공완료' as const,
    productName: '주방 수전', brand: '대림바스', model: 'DL-K522F',
    requestNote: '주방 싱크대 수전에서 물이 새요. 손잡이 돌리면 아래쪽으로 한 방울씩 떨어지는데 밤새 쟁반 가득 차있는 정도예요. 아래 밸브 부분도 같이 봐주시면 좋겠습니다.',
    workSummary: '수전 본체와 아래쪽 앵글밸브 두 군데에서 누수 확인되어 둘 다 새 부품으로 교체했습니다. 기존 부품 노후가 심해 한 번에 갈아드리는 게 깔끔할 것 같아 권해드렸어요.',
    sellingPrice: 145000, costPrice: 52000, materialSource: '인터파크 / 대림몰',
    paid: true, paidDate: '2026-05-02',
    internalMemo: '302호 사장님 친절하셨음. 다음 방문은 거실 욕실 변기 점검 원하심 (6월 예정).',
    publicFields: ['customer_name', 'address_short', 'work_date', 'status', 'product_name', 'brand', 'request_note', 'work_summary', 'before_photos', 'after_photos'],
    photos: [
      { role: 'before' as const, label: '주방 수전 — 손잡이 아래 누수', sortOrder: 1 },
      { role: 'before' as const, label: '앵글밸브 노후 상태', sortOrder: 2 },
      { role: 'after' as const, label: '신품 수전 설치 완료', sortOrder: 1 },
      { role: 'after' as const, label: '앵글밸브 신품 교체', sortOrder: 2 },
    ],
  },
  {
    id: 'p2m9k4j81bzwxe7rt3yqlb6h',
    isPublished: true,
    customerName: '오민호', phone: '010-9981-2245',
    addressFull: '서울 마포구 망원동 412-7 그린빌 105호', addressShort: '마포구 망원동',
    inquiryDate: '2026-05-03', workDate: '2026-05-06', status: '시공완료' as const,
    productName: '양변기', brand: '이누스', model: 'CC-240',
    requestNote: '변기 물 내릴 때마다 탱크 안에서 물이 계속 새는 소리가 나요. 수도세도 많이 나와서 빨리 잡고 싶습니다.',
    workSummary: '탱크 안 플러시밸브가 닳아서 물이 미세하게 새고 있었어요. 부속 일체를 새 걸로 교체했고, 핸들 쪽도 조금 헐거워져 있어서 같이 잡아드렸습니다.',
    sellingPrice: 95000, costPrice: 28000, materialSource: '자재상 (을지로)',
    paid: true, paidDate: '2026-05-06',
    internalMemo: '다음 방문 시 거실 형광등도 봐달라고 하심.',
    publicFields: ['customer_name', 'address_short', 'work_date', 'status', 'product_name', 'brand', 'model', 'request_note', 'work_summary', 'before_photos', 'after_photos'],
    photos: [
      { role: 'before' as const, label: '변기 탱크 내부 부속 상태', sortOrder: 1 },
      { role: 'after' as const, label: '신품 부속 설치', sortOrder: 1 },
    ],
  },
  {
    id: 'x4f7w2n93lerpq8kvm5oad1c',
    isPublished: false,
    customerName: '한지영', phone: '010-2718-4453',
    addressFull: '서울 송파구 잠실동 88-2 잠실파크 1402호', addressShort: '송파구 잠실동',
    inquiryDate: '2026-05-11', workDate: '2026-05-18', status: '시공대기' as const,
    productName: '디지털 도어락', brand: '삼성SDS', model: 'SHP-DH538',
    requestNote: '도어락 배터리 갈아도 자꾸 비프음 나고 가끔 안 열려요. 5년 넘어서 교체하려고 합니다.',
    workSummary: '',
    sellingPrice: 220000, costPrice: 135000, materialSource: '삼성SDS 공식몰',
    paid: false, paidDate: null,
    internalMemo: '월요일 오후 2시 약속. 지문인식 모델 SHP-DH700 견적 안내함.',
    publicFields: ['customer_name', 'address_short', 'work_date', 'status', 'product_name', 'brand', 'request_note', 'before_photos', 'after_photos'],
    photos: [
      { role: 'before' as const, label: '현재 도어락 외관', sortOrder: 1 },
    ],
  },
  {
    id: 'j8q5r2v74mnkoltb9wx3ze1d',
    isPublished: true,
    customerName: '박서윤', phone: '010-5567-0098',
    addressFull: '서울 서대문구 연희동 144-3 햇살빌라 201호', addressShort: '서대문구 연희동',
    inquiryDate: '2026-04-13', workDate: '2026-04-17', status: '시공완료' as const,
    productName: '벽걸이 에어컨 분해 청소', brand: 'LG전자', model: 'SQ09BCAWAS',
    requestNote: '에어컨에서 쾨쾨한 냄새가 너무 심해요. 켜면 거실 가득 퍼져서 사용을 못 하고 있어요.',
    workSummary: '벽걸이 본체 완전 분해 후 송풍팬·증발기 코일·드레인까지 전체 세척했습니다.',
    sellingPrice: 130000, costPrice: 18000, materialSource: '—',
    paid: true, paidDate: '2026-04-17',
    internalMemo: '1년 뒤 재청소 안내 문자 예약.',
    publicFields: ['customer_name', 'address_short', 'work_date', 'status', 'product_name', 'request_note', 'work_summary', 'before_photos', 'after_photos'],
    photos: [
      { role: 'before' as const, label: '에어컨 외관', sortOrder: 1 },
      { role: 'after' as const, label: '조립 후 시험 가동', sortOrder: 1 },
    ],
  },
  {
    id: 't3y6u1q05lvnxabwd9ke8mzf',
    isPublished: false,
    customerName: '김도현', phone: '010-4412-8867',
    addressFull: '', addressShort: '용산구 한남동',
    inquiryDate: '2026-05-19', workDate: null, status: '문의접수' as const,
    productName: '보일러 점검', brand: '경동나비엔', model: '',
    requestNote: '보일러에서 가끔 부르릉 소리가 크게 나는데 한 번 봐주실 수 있을까요?',
    workSummary: '',
    sellingPrice: 0, costPrice: 0, materialSource: '',
    paid: false, paidDate: null,
    internalMemo: '주말에 시간 가능하다고 하심.',
    publicFields: ['customer_name', 'address_short', 'status', 'product_name', 'request_note'],
    photos: [],
  },
];

// ===== DataSource =====

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'living_craft',
  synchronize: true,
  logging: false,
  entities: [
    Category, ServiceItem, ProductGroup, Product, ProductFeature, ProductColor,
    Case, CaseTag, CasePhoto,
    Job, JobPhoto,
    TechSchedule,
    JipUser,
    QuoteRequest, QuoteRequestItem, QuoteRequestPhoto,
  ],
});

// ===== 시드 함수 =====

async function seedCatalog(ds: DataSource) {
  console.log('\n[1] 카탈로그 시드...');
  const catRepo = ds.getRepository(Category);
  const itemRepo = ds.getRepository(ServiceItem);
  const groupRepo = ds.getRepository(ProductGroup);
  const prodRepo = ds.getRepository(Product);
  const featureRepo = ds.getRepository(ProductFeature);
  const colorRepo = ds.getRepository(ProductColor);

  for (const catData of CATALOG_DATA) {
    let cat = await catRepo.findOne({ where: { code: catData.code } });
    if (!cat) {
      cat = catRepo.create({
        code: catData.code, name: catData.name, intro: catData.intro,
        color: catData.color, sortOrder: catData.sortOrder,
      });
      await catRepo.save(cat);
      console.log(`  카테고리: ${cat.name}`);
    }

    for (let i = 0; i < catData.items.length; i++) {
      const d = catData.items[i];
      let item = await itemRepo.findOne({ where: { code: d.code } });
      if (!item) {
        item = itemRepo.create({
          categoryId: cat.id, code: d.code, name: d.name, description: d.description,
          price: d.price, unit: d.unit, duration: d.duration,
          illustKind: 'default', sortOrder: i, isFeatured: d.isFeatured,
        });
        await itemRepo.save(item);
        console.log(`    시공 항목: ${item.name}`);
      }

      // 해당 항목에 제품 데이터가 있으면 삽입
      const prodData = PRODUCTS_DATA[d.code];
      if (!prodData) continue;

      for (let gi = 0; gi < prodData.groups.length; gi++) {
        const gd = prodData.groups[gi];
        let group = await groupRepo.findOne({ where: { serviceItemId: item.id, code: gd.code } });
        if (!group) {
          group = groupRepo.create({
            serviceItemId: item.id, code: gd.code, label: gd.label,
            description: gd.description || null, sortOrder: gi,
          });
          await groupRepo.save(group);
        }

        for (let pi = 0; pi < gd.items.length; pi++) {
          const pd = gd.items[pi];
          let prod = await prodRepo.findOne({ where: { code: pd.code } });
          if (!prod) {
            prod = prodRepo.create({
              productGroupId: group.id, code: pd.code, brand: pd.brand, name: pd.name,
              spec: pd.spec, price: pd.price, illustKind: pd.illust,
              description: pd.description, sortOrder: pi,
            });
            await prodRepo.save(prod);
            console.log(`      제품: ${prod.name}`);

            for (let fi = 0; fi < pd.features.length; fi++) {
              await featureRepo.save(featureRepo.create({ productId: prod.id, label: pd.features[fi], sortOrder: fi }));
            }
            for (let ci = 0; ci < pd.colors.length; ci++) {
              await colorRepo.save(colorRepo.create({ productId: prod.id, label: pd.colors[ci], sortOrder: ci }));
            }
          }
        }
      }
    }
  }
  console.log('  ✅ 카탈로그 완료');
}

async function seedCases(ds: DataSource) {
  console.log('\n[2] 시공사례 시드...');
  const caseRepo = ds.getRepository(Case);
  const tagRepo = ds.getRepository(CaseTag);

  for (const cd of CASES_DATA) {
    const existing = await caseRepo.findOne({ where: { title: cd.title } });
    if (existing) { console.log(`  ⏭️  ${cd.title}`); continue; }

    const c = caseRepo.create({
      title: cd.title, area: cd.area, hours: cd.hours, dateText: cd.dateText,
      color: cd.color, isPublished: true, sortOrder: cd.sortOrder,
    });
    await caseRepo.save(c);
    for (const tag of cd.tags) {
      await tagRepo.save(tagRepo.create({ caseId: c.id, tag }));
    }
    console.log(`  ✅ ${cd.title}`);
  }
}

async function seedJobs(ds: DataSource) {
  console.log('\n[3] 샘플 시공일지 시드...');
  const jobRepo = ds.getRepository(Job);
  const photoRepo = ds.getRepository(JobPhoto);

  for (const jd of SAMPLE_JOBS_DATA) {
    const existing = await jobRepo.findOne({ where: { id: jd.id } });
    if (existing) { console.log(`  ⏭️  ${jd.customerName} (${jd.id.slice(0, 8)}...)`); continue; }

    const job = jobRepo.create({
      id: jd.id, isPublished: jd.isPublished,
      customerName: jd.customerName, phone: jd.phone,
      addressFull: jd.addressFull || null, addressShort: jd.addressShort,
      inquiryDate: jd.inquiryDate || null, workDate: jd.workDate || null,
      status: jd.status, productName: jd.productName, brand: jd.brand, model: jd.model || null,
      requestNote: jd.requestNote || null, workSummary: jd.workSummary || null,
      sellingPrice: jd.sellingPrice || null, costPrice: jd.costPrice || null,
      materialSource: jd.materialSource || null,
      paid: jd.paid, paidDate: jd.paidDate || null,
      internalMemo: jd.internalMemo || null,
      publicFields: jd.publicFields,
    });
    await jobRepo.save(job);

    for (const ph of jd.photos) {
      await photoRepo.save(photoRepo.create({
        jobId: jd.id, fileUrl: null, role: ph.role, label: ph.label, sortOrder: ph.sortOrder,
      }));
    }
    console.log(`  ✅ ${jd.customerName} (${jd.id.slice(0, 8)}...)`);
  }
}

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function seedSchedule(ds: DataSource) {
  console.log('\n[4] 시공자 일정 60일 시드...');
  const repo = ds.getRepository(TechSchedule);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let created = 0;

  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = ymd(d);
    const day = d.getDay();

    const existing = await repo.findOne({ where: { date: key } });
    if (existing) continue;

    const slotDefault = (slotId: string): 'open' | 'busy' | 'off' => {
      if (day === 0) return 'off';
      if (slotId === 'eve' && day !== 5 && day !== 6) return 'off';
      if (day === 6 && slotId === 'pm') return 'off';
      return 'open';
    };

    let am: 'open' | 'busy' | 'off' = slotDefault('am');
    let noon: 'open' | 'busy' | 'off' = slotDefault('noon');
    let pm: 'open' | 'busy' | 'off' = slotDefault('pm');
    let eve: 'open' | 'busy' | 'off' = slotDefault('eve');

    // 결정적 busy 패턴 (프로토타입과 동일)
    const seed = (d.getDate() * 7 + d.getMonth() * 31 + d.getDay()) % 11;
    if (seed === 0 && am === 'open') am = 'busy';
    if (seed === 2 && noon === 'open') noon = 'busy';
    if (seed === 4 && pm === 'open') pm = 'busy';
    if (seed === 7) {
      if (am === 'open') am = 'busy';
      if (noon === 'open') noon = 'busy';
      if (pm === 'open') pm = 'busy';
      if (eve === 'open') eve = 'busy';
    }

    await repo.save(repo.create({ date: key, am, noon, pm, eve }));
    created++;
  }
  console.log(`  ✅ ${created}일 생성`);
}

// ===== main =====

async function main() {
  console.log('🌱 집슐랭 시드 시작...');
  await ds.initialize();

  await seedCatalog(ds);
  await seedCases(ds);
  await seedJobs(ds);
  await seedSchedule(ds);

  await ds.destroy();
  console.log('\n✅ 시드 완료!');
}

main().catch((e) => {
  console.error('❌ 시드 실패:', e);
  process.exit(1);
});
