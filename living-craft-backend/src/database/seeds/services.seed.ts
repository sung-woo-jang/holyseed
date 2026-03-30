import { AppDataSource } from './data-source';
import { Service } from '@lc/modules/services/entities/service.entity';
import { Icon } from '@lc/modules/icons/entities/icon.entity';

/**
 * 기본 서비스 데이터 생성
 */
export async function createServices() {
  console.log('🔧 Starting services seed...');

  const serviceRepository = AppDataSource.getRepository(Service);
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
      iconColor: '#424242',
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
      iconColor: '#424242',
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
      iconColor: '#424242',
      duration: '30분-1시간',
      requiresTimeSelection: true,
      sortOrder: 3,
    },
  ];

  // 서비스 생성
  for (const data of servicesData) {
    const service = serviceRepository.create({
      title: data.title,
      description: data.description,
      iconId: data.iconId,
      iconBgColor: data.iconBgColor,
      iconColor: data.iconColor,
      duration: data.duration,
      requiresTimeSelection: data.requiresTimeSelection,
      sortOrder: data.sortOrder,
      isActive: true,
    });
    await serviceRepository.save(service);
  }

  console.log('✅ Services created successfully!');
  console.log(`   - 서비스: ${servicesData.length}개`);
}
