import { z } from 'zod'

/**
 * Review Entity Zod 스키마
 */
export const reviewSchema = z.object({
  id: z.string(),
  reservationId: z.string(),
  userId: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  customerName: z.string(),
  rating: z.number().min(1).max(5),
  content: z.string(),
  photos: z.array(z.string()),
  isVisible: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Review = z.infer<typeof reviewSchema>
