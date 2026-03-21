import { z } from 'zod'

/**
 * 예약 상태 타입
 */
export const reservationStatusSchema = z.enum([
  'pending',
  'confirmed',
  'completed',
  'cancelled',
])

export type ReservationStatus = z.infer<typeof reservationStatusSchema>

/**
 * 아이콘 스키마
 */
const iconSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  name: z.string(),
  type: z.enum(['MONO', 'COLOR']),
})

/**
 * 서비스 스키마
 */
const serviceSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string(),
  description: z.string(),
  iconId: z.number(),
  iconBgColor: z.string(),
  iconColor: z.string(),
  duration: z.string(),
  requiresTimeSelection: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  icon: iconSchema,
})

/**
 * 고객 스키마
 */
const customerSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  uuid: z.string(),
  tossUserId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  refreshToken: z.string().nullable(),
})

/**
 * 예약 엔티티 스키마
 */
export const reservationSchema = z.object({
  id: z.number(),
  reservationNumber: z.string(),
  customerId: z.number(),
  serviceId: z.number(),
  customerName: z.string(),
  customerPhone: z.string(),
  estimateDate: z.string(),
  estimateTime: z.string(),
  estimateConfirmedAt: z.string().nullable(),
  constructionDate: z.string().nullable(),
  constructionTime: z.string().nullable(),
  constructionScheduledAt: z.string().nullable(),
  address: z.string(),
  detailAddress: z.string(),
  memo: z.string(),
  photos: z.array(z.string()).nullable(),
  status: reservationStatusSchema,
  cancelReason: z.string().nullable().optional(),
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  service: serviceSchema,
  customer: customerSchema,
})

export type Reservation = z.infer<typeof reservationSchema>
