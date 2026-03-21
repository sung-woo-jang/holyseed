import { AppDataSource } from './data-source';
import { Service } from '@modules/services/entities/service.entity';
import { ServiceRegion } from '@modules/services/entities/service-region.entity';
import { District } from '@modules/admin/districts/entities/district.entity';
import { DistrictLevel } from '@common/enums/district-level.enum';
import { Icon } from '@modules/icons/entities/icon.entity';

/**
 * 기본 서비스 데이터 생성
 */
export async function createServices() {
  console.log('🔧 Starting services seed...');

  const serviceRepository = AppDataSource.getRepository(Service);
  const serviceRegionRepository = AppDataSource.getRepository(ServiceRegion);
  const districtRepository = AppDataSource.getRepository(District);
  const iconRepository = AppDataSource.getRepository(Icon);

  // 기존 데이터 확인
  const existingCount = await serviceRepository.count();
  if (existingCount > 0) {
    console.log('ℹ️  Services already exist. Skipping...');
    return;
  }

  // 아이콘 조회
  const homeIcon = await iconRepository.findOne({
    where: { name: 'icon-home-blue-fill' },
  });
  const washingIcon = await iconRepository.findOne({
    where: { name: 'icon-washing-machine-fill' },
  });
  const gridIcon = await iconRepository.findOne({
    where: { name: 'icon-gridview-fill' },
  });

  if (!homeIcon || !washingIcon || !gridIcon) {
    console.error('❌ Required icons not found in database');
    console.error('   Missing icons:', {
      home: !homeIcon,
      washing: !washingIcon,
      grid: !gridIcon,
    });
    throw new Error('Required icons not found');
  }

  // 서비스 데이터
  const servicesData = [
    {
      title: '인테리어 필름',
      description:
        '싱크대, 가구, 문틀 등에 고급 인테리어 필름을 시공합니다. 새 집처럼 깔끔하게 변신시켜 드립니다.',
      iconId: homeIcon.id,
      iconBgColor: '#E3F2FD',
      duration: '하루 종일',
      requiresTimeSelection: false,
      sortOrder: 1,
    },
    {
      title: '유리 청소',
      description:
        '아파트, 상가, 오피스텔 등 고층 유리창 전문 청소 서비스입니다. 깨끗하고 안전하게 시공합니다.',
      iconId: washingIcon.id,
      iconBgColor: '#E8F5E9',
      duration: '1-2시간',
      requiresTimeSelection: true,
      sortOrder: 2,
    },
    {
      title: '방충망 설치',
      description:
        '튼튼한 방충망 교체 및 신규 설치 서비스입니다. 맞춤 제작하여 깔끔하게 시공합니다.',
      iconId: gridIcon.id,
      iconBgColor: '#FFF3E0',
      duration: '30분-1시간',
      requiresTimeSelection: true,
      sortOrder: 3,
    },
  ];

  // 서비스 생성
  const services: Service[] = [];
  for (const data of servicesData) {
    const service = serviceRepository.create({
      title: data.title,
      description: data.description,
      iconId: data.iconId,
      iconBgColor: data.iconBgColor,
      duration: data.duration,
      requiresTimeSelection: data.requiresTimeSelection,
      sortOrder: data.sortOrder,
      isActive: true,
    });
    const savedService = await serviceRepository.save(service);
    services.push(savedService);
  }

  // 서비스 가능 지역 설정 (시/군/구 레벨)
  const sigunguDistricts = await districtRepository.find({
    where: { level: DistrictLevel.SIGUNGU, isActive: true },
    relations: ['parent'],
  });

  // 각 서비스에 모든 지역 연결 (출장비는 지역에 따라 다르게 설정)
  for (const service of services) {
    for (const district of sigunguDistricts) {
      // 서울: 출장비 무료, 경기/인천: 10,000원
      let estimateFee = 0;
      if (district.parent?.name === '경기도') {
        estimateFee = 10000;
      } else if (district.parent?.name === '인천광역시') {
        estimateFee = 10000;
      }

      const serviceRegion = serviceRegionRepository.create({
        serviceId: service.id,
        districtId: district.id,
        estimateFee,
      });
      await serviceRegionRepository.save(serviceRegion);
    }
  }

  console.log('✅ Services created successfully!');
  console.log(`   - 서비스: ${servicesData.length}개`);
  console.log(
    `   - 서비스 지역: ${services.length * sigunguDistricts.length}개`,
  );
}
