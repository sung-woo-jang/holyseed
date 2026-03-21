import { AppDataSource } from './data-source';
import {
  Reservation,
  ReservationStatus,
} from '@modules/reservations/entities/reservation.entity';
import { Customer } from '@modules/customers/entities/customer.entity';
import { Service } from '@modules/services/entities/service.entity';
import { faker } from '@faker-js/faker';
import { addDays, subDays, format } from 'date-fns';

export async function createReservations(): Promise<void> {
  console.log('🔧 Starting reservations seed...');

  const reservationRepository = AppDataSource.getRepository(Reservation);
  const customerRepository = AppDataSource.getRepository(Customer);
  const serviceRepository = AppDataSource.getRepository(Service);

  // 기존 데이터 확인
  const existingCount = await reservationRepository.count();
  if (existingCount > 0) {
    console.log('ℹ️  Reservations already exist. Skipping...');
    return;
  }

  // 고객 및 서비스 조회
  const customers = await customerRepository.find();
  const services = await serviceRepository.find({ order: { id: 'ASC' } });

  if (customers.length === 0 || services.length === 0) {
    console.log(
      '⚠️  Customers or Services not found. Please run their seeds first.',
    );
    return;
  }

  // 단골 고객 선택 (처음 5명)
  const regularCustomers = customers.slice(0, 5);
  const otherCustomers = customers.slice(5);

  // 상태 분포 배열 (50건)
  const statusDistribution = [
    ...Array(10).fill(ReservationStatus.PENDING), // 20%
    ...Array(15).fill(ReservationStatus.CONFIRMED), // 30%
    ...Array(20).fill(ReservationStatus.COMPLETED), // 40%
    ...Array(5).fill(ReservationStatus.CANCELLED), // 10%
  ];

  // 서비스 분포 배열 (50건)
  const serviceDistribution = [
    ...Array(17).fill(services[0]), // 인테리어 필름 (34%)
    ...Array(17).fill(services[1]), // 유리 청소 (34%)
    ...Array(16).fill(services[2]), // 방충망 설치 (32%)
  ];

  // 한국 주소 템플릿
  const seoulDistricts = [
    '강남구',
    '서초구',
    '송파구',
    '강동구',
    '마포구',
    '용산구',
    '성동구',
    '광진구',
    '종로구',
    '중구',
  ];
  const gyeonggiCities = [
    '수원시',
    '성남시',
    '고양시',
    '용인시',
    '부천시',
    '안산시',
    '안양시',
    '남양주시',
  ];
  const incheonDistricts = ['남동구', '부평구', '계양구', '서구', '연수구'];

  const reservations: Reservation[] = [];
  const usedNumbers = new Set<string>(); // 중복 방지

  for (let i = 0; i < 50; i++) {
    // 고객 선택 (단골 고객은 2-3회 예약)
    let customer: Customer;
    if (i < 15) {
      // 처음 15건은 단골 고객 (각 3번씩)
      customer = regularCustomers[Math.floor(i / 3)];
    } else {
      // 나머지는 랜덤
      customer = faker.helpers.arrayElement([
        ...regularCustomers,
        ...otherCustomers,
      ]);
    }

    // 서비스 선택 (균등 분포)
    const service = serviceDistribution[i];

    // 견적 날짜: 최근 3개월 (-90 ~ -1일)
    const daysAgo = faker.number.int({ min: 1, max: 90 });
    const estimateDate = subDays(new Date(), daysAgo);

    // 시공 날짜: 견적 날짜 + 3-10일
    const constructionDate = addDays(
      estimateDate,
      faker.number.int({ min: 3, max: 10 }),
    );

    // 시공 시간 (requiresTimeSelection 고려)
    const constructionTime = service.requiresTimeSelection
      ? `${faker.number.int({ min: 9, max: 17 })}:00`
      : null;

    // 예약 번호 생성 (YYYYMMDD-XXXX, 중복 방지)
    let reservationNumber: string;
    do {
      const datePrefix = format(estimateDate, 'yyyyMMdd');
      const sequence = faker.string.numeric(4);
      reservationNumber = `${datePrefix}-${sequence}`;
    } while (usedNumbers.has(reservationNumber));
    usedNumbers.add(reservationNumber);

    // 주소 생성
    let address: string;
    const region = faker.number.int({ min: 0, max: 2 });
    if (region === 0) {
      address = `서울특별시 ${faker.helpers.arrayElement(seoulDistricts)} ${faker.location.street()}`;
    } else if (region === 1) {
      address = `경기도 ${faker.helpers.arrayElement(gyeonggiCities)} ${faker.location.street()}`;
    } else {
      address = `인천광역시 ${faker.helpers.arrayElement(incheonDistricts)} ${faker.location.street()}`;
    }

    // 상태 (분포에 따라)
    const status = statusDistribution[i];

    const reservation = reservationRepository.create({
      reservationNumber,
      customerId: customer.id,
      serviceId: service.id,
      estimateDate,
      estimateTime: `${faker.number.int({ min: 9, max: 18 })}:00`,
      constructionDate,
      constructionTime,
      address,
      detailAddress: `${faker.number.int({ min: 1, max: 20 })}층 ${faker.number.int({ min: 101, max: 1205 })}호`,
      customerName: customer.name,
      customerPhone: customer.phone,
      memo: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null, // 30%만 메모
      photos: faker.datatype.boolean(0.4)
        ? Array.from(
            { length: faker.number.int({ min: 1, max: 3 }) },
            () =>
              `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/800/600`,
          )
        : [], // 40%만 사진
      status,
      cancelledAt:
        status === ReservationStatus.CANCELLED
          ? faker.date.recent({ days: 30 })
          : null,
    });

    const saved = await reservationRepository.save(reservation);
    reservations.push(saved);
  }

  console.log(`✅ Created ${reservations.length} reservations`);
  console.log(
    `   - PENDING: ${reservations.filter((r) => r.status === ReservationStatus.PENDING).length}`,
  );
  console.log(
    `   - CONFIRMED: ${reservations.filter((r) => r.status === ReservationStatus.CONFIRMED).length}`,
  );
  console.log(
    `   - COMPLETED: ${reservations.filter((r) => r.status === ReservationStatus.COMPLETED).length}`,
  );
  console.log(
    `   - CANCELLED: ${reservations.filter((r) => r.status === ReservationStatus.CANCELLED).length}`,
  );
}
