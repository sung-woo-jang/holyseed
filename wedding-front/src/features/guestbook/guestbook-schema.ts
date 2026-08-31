import { z } from 'zod'

export const guestbookFormSchema = z.object({
  guestName: z.string().min(1, '이름을 입력해주세요').max(20, '20자 이내로 입력해주세요'),
  message: z.string().min(1, '메시지를 입력해주세요').max(300, '300자 이내로 입력해주세요'),
})

export type GuestbookFormData = z.infer<typeof guestbookFormSchema>
