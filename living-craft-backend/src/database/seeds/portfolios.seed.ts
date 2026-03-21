import { AppDataSource } from './data-source';
import { Portfolio } from '@modules/portfolios/entities/portfolio.entity';
import { Service } from '@modules/services/entities/service.entity';
import { faker } from '@faker-js/faker';

interface PortfolioTemplate {
  categories: string[];
  projectNames: string[];
  tags: string[];
  descriptions: string[];
}

export async function createPortfolios(): Promise<void> {
  console.log('🔧 Starting portfolios seed...');

  const portfolioRepository = AppDataSource.getRepository(Portfolio);
  const serviceRepository = AppDataSource.getRepository(Service);

  // 기존 데이터 확인
  const existingCount = await portfolioRepository.count();
  if (existingCount > 0) {
    console.log('ℹ️  Portfolios already exist. Skipping...');
    return;
  }

  // 서비스 조회
  const services = await serviceRepository.find({ order: { id: 'ASC' } });
  if (services.length === 0) {
    console.log('⚠️  Services not found. Please run services seed first.');
    return;
  }

  // 서비스별 포트폴리오 데이터
  const portfolioTemplates: Record<string, PortfolioTemplate> = {
    '인테리어 필름': {
      categories: ['주방', '싱크대', '가구', '문틀', '욕실'],
      projectNames: [
        '강남 아파트 싱크대 대리석 필름 시공',
        '서초 빌라 주방 가구 우드 패턴 시공',
        '송파 오피스텔 욕실 도어 필름 작업',
        '마포 아파트 현관문 메탈 필름 시공',
        '용산 주택 전체 가구 리폼 프로젝트',
      ],
      tags: ['대리석패턴', '우드패턴', '메탈', '리폼', '싱크대', '주방가구'],
      descriptions: [
        '오래된 싱크대를 고급 대리석 패턴 필름으로 새것처럼 변신',
        '낡은 주방 가구를 따뜻한 우드 패턴으로 분위기 전환',
        '욕실 도어를 깨끗한 화이트 필름으로 리뉴얼',
        '현관문을 고급스러운 메탈 필름으로 업그레이드',
        '집 전체 가구를 모던한 스타일로 통일감 있게 시공',
      ],
    },
    '유리 청소': {
      categories: ['아파트', '상가', '오피스텔', '사무실', '주택'],
      projectNames: [
        '강남역 오피스 빌딩 유리창 전문 청소',
        '잠실 아파트 고층 유리창 청소 작업',
        '신촌 상가 쇼윈도 유리 광택 서비스',
        '판교 사무실 대형 유리 파티션 청소',
        '분당 아파트 베란다 유리 집중 클리닝',
      ],
      tags: ['고층청소', '안전작업', '전문장비', '친환경세제', '광택'],
      descriptions: [
        '20층 이상 고층 유리창을 안전하게 깨끗하게 청소',
        '아파트 전면 유리창을 친환경 세제로 말끔하게',
        '상가 쇼윈도를 광택 작업까지 완벽하게 마무리',
        '사무실 대형 유리 파티션을 얼룩 없이 투명하게',
        '베란다 유리창과 새시까지 구석구석 깨끗하게',
      ],
    },
    '방충망 설치': {
      categories: ['아파트', '빌라', '주택', '상가', '오피스'],
      projectNames: [
        '서초 아파트 거실 방충망 맞춤 제작',
        '강동 빌라 전체 방충망 교체 작업',
        '마포 주택 미세먼지 차단망 설치',
        '송파 상가 출입구 방충 커튼 시공',
        '성동 오피스 창문 방충망 대량 교체',
      ],
      tags: ['맞춤제작', '미세먼지차단', '튼튼한망', '깔끔시공', '교체'],
      descriptions: [
        '거실 대형 창문에 맞춘 튼튼한 방충망 제작 설치',
        '낡은 방충망 전체를 새것으로 깔끔하게 교체',
        '미세먼지까지 차단하는 고급 방충망 시공',
        '상가 출입구에 방충 효과가 뛰어난 커튼 설치',
        '사무실 전체 창문 방충망을 일괄 교체',
      ],
    },
  };

  const portfolios: Portfolio[] = [];
  let sortOrder = 0;

  // 각 서비스별로 5건씩 생성
  for (const service of services) {
    const template = portfolioTemplates[service.title];
    if (!template) continue;

    for (let i = 0; i < 5; i++) {
      const imageCount = faker.number.int({ min: 3, max: 5 });
      const images = Array.from(
        { length: imageCount },
        () =>
          `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/800/600`,
      );

      const tagCount = faker.number.int({ min: 2, max: 4 });
      const tags = faker.helpers.arrayElements(template.tags, tagCount);

      const portfolio = portfolioRepository.create({
        category: template.categories[i],
        projectName: template.projectNames[i],
        client: faker.datatype.boolean(0.7) ? faker.company.name() : null, // 70%만 클라이언트 표시
        duration: faker.helpers.arrayElement([
          '1일',
          '2일',
          '3일',
          '반나절',
          '1-2일',
        ]),
        description: template.descriptions[i],
        detailedDescription: `${template.descriptions[i]}\n\n작업 내용:\n- 고품질 자재 사용\n- 전문 시공 기술 적용\n- 꼼꼼한 마무리 작업\n- 사후 관리 서비스 제공`,
        images,
        tags,
        serviceId: service.id,
        isActive: true,
        sortOrder: sortOrder++,
      });

      const saved = await portfolioRepository.save(portfolio);
      portfolios.push(saved);
    }
  }

  console.log(`✅ Created ${portfolios.length} portfolios`);
  services.forEach((service) => {
    const count = portfolios.filter((p) => p.serviceId === service.id).length;
    console.log(`   - ${service.title}: ${count}개`);
  });
}
