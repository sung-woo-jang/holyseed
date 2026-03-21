import { AppDataSource } from './data-source';
import { Holiday } from '@modules/settings/entities/holiday.entity';
import { faker } from '@faker-js/faker';
import { addDays, format } from 'date-fns';

export async function createHolidays(): Promise<void> {
  console.log('🔧 Starting holidays seed...');

  const holidayRepository = AppDataSource.getRepository(Holiday);

  // 기존 데이터 확인
  const existingCount = await holidayRepository.count();
  if (existingCount > 0) {
    console.log('ℹ️  Holidays already exist. Skipping...');
    return;
  }

  // 휴무 사유 목록
  const holidayReasons = [
    '신정',
    '설날 연휴',
    '추석 연휴',
    '어린이날',
    '현충일',
    '광복절',
    '개천절',
    '한글날',
    '개인 사정',
    '정기 휴무',
  ];

  const holidays: Holiday[] = [];
  const usedDates = new Set<string>(); // 중복 방지

  // 10일의 휴무일 생성 (오늘부터 90일 이내)
  let attempts = 0;
  const maxAttempts = 50; // 무한 루프 방지

  while (holidays.length < 10 && attempts < maxAttempts) {
    attempts++;

    // 랜덤 날짜 생성 (0~90일 후)
    const daysToAdd = faker.number.int({ min: 0, max: 90 });
    const holidayDate = addDays(new Date(), daysToAdd);
    const dateString = format(holidayDate, 'yyyy-MM-dd');

    // 중복 체크
    if (usedDates.has(dateString)) {
      continue;
    }
    usedDates.add(dateString);

    const holiday = holidayRepository.create({
      date: holidayDate,
      reason: faker.helpers.arrayElement(holidayReasons),
    });

    const saved = await holidayRepository.save(holiday);
    holidays.push(saved);
  }

  // 날짜순 정렬하여 로그 출력
  holidays.sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log(`✅ Created ${holidays.length} holidays`);
  holidays.forEach((h) => {
    console.log(`   - ${format(h.date, 'yyyy-MM-dd')}: ${h.reason}`);
  });
}
