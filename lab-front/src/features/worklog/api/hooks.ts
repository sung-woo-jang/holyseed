import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, WORKLOG_API } from '@/shared/api'
import { useStandardQuery, useStandardMutation } from '@/shared/hooks/custom-query'
import type { Worklog, WorklogInput, WorklogPhoto, WorklogSearchResult } from './types'

export function useWorklogMonth(year: number, month: number) {
  return useStandardQuery<WorklogSearchResult>({
    queryKey: ['worklog', 'month', year, month],
    queryFn: async () => (await axiosInstance.post<WorklogSearchResult>(WORKLOG_API.SEARCH, { year, month })).data,
  })
}

export function useCreateWorklog() {
  const qc = useQueryClient()
  return useStandardMutation<Worklog, Error, WorklogInput>({
    mutationFn: async (input) => (await axiosInstance.post<Worklog>(WORKLOG_API.CREATE, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog'] }),
  })
}

export function useUpdateWorklog() {
  const qc = useQueryClient()
  return useStandardMutation<Worklog, Error, { id: number; input: Partial<WorklogInput> }>({
    mutationFn: async ({ id, input }) => (await axiosInstance.post<Worklog>(WORKLOG_API.UPDATE(id), input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog'] }),
  })
}

/** 근무 사진 업로드 (최대 5장) — FormData 전송이라 인스턴스 기본 Content-Type(json)을 제거해 boundary 자동 설정 */
export function useUploadWorklogPhotos() {
  return useStandardMutation<{ photos: WorklogPhoto[] }, Error, File[]>({
    mutationFn: async (files) => {
      const formData = new FormData()
      files.forEach((file) => formData.append('photos', file))
      return (
        await axiosInstance.post<{ photos: WorklogPhoto[] }>(WORKLOG_API.UPLOAD_PHOTOS, formData, {
          headers: { 'Content-Type': undefined },
        })
      ).data
    },
  })
}

export function useDeleteWorklog() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(WORKLOG_API.DELETE(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog'] }),
  })
}
