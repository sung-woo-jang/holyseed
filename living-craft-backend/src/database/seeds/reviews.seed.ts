import { AppDataSource } from './data-source';
import { Review } from '@modules/reviews/entities/review.entity';
import {
  Reservation,
  ReservationStatus,
} from '@modules/reservations/entities/reservation.entity';
import { faker } from '@faker-js/faker';

export async function createReviews(): Promise<void> {
  console.log('🔧 Starting reviews seed...');

  const reviewRepository = AppDataSource.getRepository(Review);
  const reservationRepository = AppDataSource.getRepository(Reservation);

  // 기존 데이터 확인
  const existingCount = await reviewRepository.count();
  if (existingCount > 0) {
    console.log('ℹ️  Reviews already exist. Skipping...');
    return;
  }

  // COMPLETED 상태의 예약만 조회
  const completedReservations = await reservationRepository.find({
    where: { status: ReservationStatus.COMPLETED },
    relations: ['customer', 'service'],
  });

  if (completedReservations.length === 0) {
    console.log(
      '⚠️  No completed reservations found. Please run reservations seed first.',
    );
    return;
  }

  // 30건 또는 완료된 예약의 60% 중 작은 값
  const reviewCount = Math.min(
    30,
    Math.floor(completedReservations.length * 0.6),
  );

  // 랜덤하게 선택 (shuffle로 중복 방지)
  const selectedReservations = faker.helpers
    .shuffle(completedReservations)
    .slice(0, reviewCount);

  // 리뷰 템플릿 (한국어)
  const reviewTemplates: Record<number, string[]> = {
    5: [
      '정말 꼼꼼하고 친절하게 작업해주셨어요! 결과물도 완벽합니다.',
      '가격 대비 정말 만족스러운 서비스였습니다. 추천합니다!',
      '시공 퀄리티가 정말 좋아요. 다음에도 꼭 다시 이용하겠습니다.',
      '전문가답게 깔끔하게 마무리해주셨습니다. 감사합니다!',
      '친절하고 신속한 작업이었습니다. 추천드려요!',
    ],
    4: [
      '전반적으로 만족스러웠습니다. 작업 시간이 예상보다 조금 길었어요.',
      '결과물은 좋았는데 약속 시간에 조금 늦으셨어요. 그래도 만족합니다.',
      '시공은 잘 되었는데 마무리 청소가 아쉬웠어요.',
      '가격도 합리적이고 작업도 깔끔했습니다. 만족해요!',
    ],
    3: [
      '보통이었습니다. 큰 문제는 없었어요.',
      '시공 결과는 괜찮은데 의사소통이 조금 아쉬웠습니다.',
      '생각했던 것보다는 평범했어요.',
    ],
    2: [
      '기대에 못 미쳤어요. 다시 보수 작업이 필요할 것 같습니다.',
      '시공 품질이 기대 이하였습니다.',
    ],
    1: ['매우 불만족스러웠습니다. 다시 이용하지 않을 것 같아요.'],
  };

  const reviews: Review[] = [];

  for (const reservation of selectedReservations) {
    // 평점 분포 (80%는 4-5점, 20%는 3점 이하)
    let rating: number;
    if (faker.datatype.boolean(0.8)) {
      // 80%: 4-5점
      rating = faker.helpers.arrayElement([4, 4, 5, 5, 5]); // 5점이 더 많도록
    } else {
      // 20%: 1-3점
      rating = faker.number.int({ min: 1, max: 3 });
    }

    // 템플릿에서 리뷰 선택
    const comment = faker.helpers.arrayElement(reviewTemplates[rating]);

    const review = reviewRepository.create({
      reservationId: reservation.id,
      customerId: reservation.customerId,
      serviceId: reservation.serviceId,
      rating,
      comment,
    });

    const saved = await reviewRepository.save(review);
    reviews.push(saved);
  }

  console.log(`✅ Created ${reviews.length} reviews`);
  console.log(`   - 5 stars: ${reviews.filter((r) => r.rating === 5).length}`);
  console.log(`   - 4 stars: ${reviews.filter((r) => r.rating === 4).length}`);
  console.log(`   - 3 stars: ${reviews.filter((r) => r.rating === 3).length}`);
  console.log(`   - 2 stars: ${reviews.filter((r) => r.rating === 2).length}`);
  console.log(`   - 1 star: ${reviews.filter((r) => r.rating === 1).length}`);
  console.log(
    `   - Average rating: ${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)}`,
  );
}
