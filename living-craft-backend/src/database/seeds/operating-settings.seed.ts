import { AppDataSource } from './data-source';
import {
  OperatingSetting,
  OperatingType,
} from '@modules/settings/entities/operating-setting.entity';

/**
 * 운영 시간 설정 데이터 생성
 */
export async function createOperatingSettings() {
  console.log('⏰ Starting operating settings seed...');

  const settingRepository = AppDataSource.getRepository(OperatingSetting);

  // 기존 데이터 확인
  const existingCount = await settingRepository.count();
  if (existingCount > 0) {
    console.log('ℹ️  Operating settings already exist. Skipping...');
    return;
  }

  // 견적 설정 (평일 저녁)
  const estimateSetting = settingRepository.create({
    type: OperatingType.ESTIMATE,
    availableDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    startTime: '18:00',
    endTime: '22:00',
    slotDuration: 60,
  });
  await settingRepository.save(estimateSetting);

  // 시공 설정 (평일 + 토요일 주간)
  const constructionSetting = settingRepository.create({
    type: OperatingType.CONSTRUCTION,
    availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: 60,
  });
  await settingRepository.save(constructionSetting);

  console.log('✅ Operating settings created successfully!');
  console.log('   - 견적: 평일 18:00-22:00 (1시간 슬롯)');
  console.log('   - 시공: 평일+토 09:00-18:00 (1시간 슬롯)');
}
