import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  async getStats() {
    // Mock 데이터 반환 (추후 실제 DB 쿼리로 교체)
    return {
      todayReservations: {
        count: 5,
        change: 20, // 전일 대비 +20%
      },
      monthlyReservations: {
        count: 48,
        change: -10, // 전월 대비 -10%
      },
      averageRating: {
        value: 4.8,
        totalReviews: 127,
      },
      completionRate: {
        percentage: 92,
        completed: 44,
        total: 48,
      },
      monthlyChart: {
        labels: ['7월', '8월', '9월', '10월', '11월', '12월'],
        data: [30, 42, 38, 45, 52, 48],
      },
      serviceDistribution: {
        labels: [
          '인테리어 필름',
          '창문 유리 청소',
          '베란다 유리 청소',
          '욕실 유리 청소',
        ],
        data: [24, 15, 6, 3],
      },
      timeDistribution: {
        labels: ['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'],
        data: [12, 18, 14, 4],
      },
      recentReservations: [],
      recentReviews: [],
    };
  }
}
