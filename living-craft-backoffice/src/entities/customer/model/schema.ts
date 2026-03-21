import { z } from 'zod'

/**
 * 고객 엔티티 스키마
 */
export const customerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '고객명을 입력해주세요.'),
  phone: z.string().min(1, '전화번호를 입력해주세요.'),
  email: z.string().email('올바른 이메일 형식이 아닙니다.').optional(),
  totalReservations: z.number().min(0),
  totalReviews: z.number().min(0),
  averageRating: z.number().min(0).max(5).optional(),
  createdAt: z.string(),
  lastReservationAt: z.string().optional(),
})

export type Customer = z.infer<typeof customerSchema>

/**
 * 고객 상세 정보 스키마
 */
export const customerDetailSchema = customerSchema.extend({
  reservations: z.array(z.any()), // Reservation 타입 참조
  reviews: z.array(z.any()), // Review 타입 참조
})

export type CustomerDetail = z.infer<typeof customerDetailSchema>
