import { z } from 'zod'

export const attendanceFormSchema = z.object({
  guestName: z.string().min(1, '이름을 입력해주세요').max(50),
  guestCount: z.number().int().min(1, '최소 1명').max(10, '최대 10명'),
  attendanceStatus: z.enum(['ATTENDING', 'NOT_ATTENDING', 'MAYBE']),
  message: z.string().max(500).optional(),
  phoneNumber: z.string().max(20).optional(),
})

export type AttendanceFormData = z.infer<typeof attendanceFormSchema>
