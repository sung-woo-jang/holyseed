import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, WORKLOG_API } from '@/shared/api'
import { useStandardQuery, useStandardMutation } from '@/shared/hooks/custom-query'
import type {
  Worklog,
  WorklogCategoryOption,
  WorklogInput,
  WorklogJobOption,
  WorklogPhoto,
  WorklogSearchResult,
} from './types'

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

export function useWorklogJobOptions() {
  return useStandardQuery<WorklogJobOption[]>({
    queryKey: ['worklog', 'job-options'],
    queryFn: async () => (await axiosInstance.get<WorklogJobOption[]>(WORKLOG_API.JOB_OPTIONS)).data,
  })
}

export function useCreateJobOption() {
  const qc = useQueryClient()
  return useStandardMutation<WorklogJobOption, Error, { name: string; category: string }>({
    mutationFn: async (input) =>
      (await axiosInstance.post<WorklogJobOption>(WORKLOG_API.CREATE_JOB_OPTION, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog', 'job-options'] }),
  })
}

export function useDeleteJobOption() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(WORKLOG_API.DELETE_JOB_OPTION(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog', 'job-options'] }),
  })
}

export function useWorklogCategoryOptions() {
  return useStandardQuery<WorklogCategoryOption[]>({
    queryKey: ['worklog', 'category-options'],
    queryFn: async () => (await axiosInstance.get<WorklogCategoryOption[]>(WORKLOG_API.CATEGORY_OPTIONS)).data,
  })
}

export function useCreateCategoryOption() {
  const qc = useQueryClient()
  return useStandardMutation<WorklogCategoryOption, Error, string>({
    mutationFn: async (name) =>
      (await axiosInstance.post<WorklogCategoryOption>(WORKLOG_API.CREATE_CATEGORY_OPTION, { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog', 'category-options'] }),
  })
}

export function useUpdateCategoryOption() {
  const qc = useQueryClient()
  return useStandardMutation<
    WorklogCategoryOption,
    Error,
    { id: number } & Partial<
      Pick<
        WorklogCategoryOption,
        'name' | 'defaultDailyWage' | 'defaultWithholdingApplied' | 'overtimeThresholdHours' | 'overtimeExtraRate'
      >
    >
  >({
    mutationFn: async (input) =>
      (await axiosInstance.post<WorklogCategoryOption>(WORKLOG_API.UPDATE_CATEGORY_OPTION, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog', 'category-options'] }),
  })
}

export function useReorderCategoryOptions() {
  const qc = useQueryClient()
  return useStandardMutation<WorklogCategoryOption[], Error, number[]>({
    mutationFn: async (ids) =>
      (await axiosInstance.post<WorklogCategoryOption[]>(WORKLOG_API.REORDER_CATEGORY_OPTIONS, { ids })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog', 'category-options'] }),
  })
}

export function useWorklogSortPref() {
  return useStandardQuery<{ key: string; dir: 'asc' | 'desc' } | null>({
    queryKey: ['worklog', 'sort-pref'],
    queryFn: async () =>
      (await axiosInstance.get<{ key: string; dir: 'asc' | 'desc' } | null>(WORKLOG_API.SORT_PREF)).data,
  })
}

export function useSaveWorklogSortPref() {
  return useStandardMutation<{ key: string; dir: 'asc' | 'desc' }, Error, { key: string; dir: 'asc' | 'desc' }>({
    mutationFn: async (pref) =>
      (await axiosInstance.post<{ key: string; dir: 'asc' | 'desc' }>(WORKLOG_API.SORT_PREF, pref)).data,
  })
}
