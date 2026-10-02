import { api } from '../lib/api';

export type PayStatus = 'RECEIVED' | 'EXPECTED' | 'UNPAID' | 'DAYOFF' | 'SCHEDULED';

export interface WorklogPhoto {
  filename: string;
  path: string;
  url: string;
}

export interface WorklogRecord {
  id: number;
  title: string;
  workDate: string;
  startTime: string | null;
  endTime: string | null;
  breakHours: number;
  jobs: string[];
  payStatus: PayStatus;
  category: string;
  dailyWage: number;
  amount: number;
  amountOverride: number | null;
  address: string | null;
  memo: string | null;
  photos: WorklogPhoto[];
  withholdingApplied: boolean;
  payMultiplier: number;
  effectiveAmount: number;
  netAmount: number;
}

export interface WorklogSummary {
  workDays: number;
  laborUnits: number;
  totalAmount: number;
  totalNet: number;
  receivedNet: number;
  pendingNet: number;
}

export interface WorklogCategoryOption {
  id: number;
  name: string;
  sortOrder: number;
  defaultDailyWage: number | null;
  defaultWithholdingApplied: boolean;
  overtimeThresholdHours: number;
  overtimeExtraRate: number;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  defaultBreakHours: number | null;
  defaultAddress: string | null;
  isDayOff: boolean;
}

export interface WorklogJobOption {
  id: number;
  name: string;
  category: string;
}

export interface WorklogTitleOption {
  id: number;
  name: string;
  category: string;
  lastUsedAt: string;
  count: number;
}

export interface WorklogInput {
  title: string;
  workDate: string;
  /** 수정 시 비운 값은 null로 보내야 서버에서 지워진다 (undefined는 변경 없음으로 취급) */
  startTime?: string | null;
  endTime?: string | null;
  breakHours?: number;
  jobs?: string[];
  payStatus?: PayStatus;
  category?: string;
  dailyWage?: number;
  amountOverride?: number | null;
  withholdingApplied?: boolean;
  payMultiplier?: number;
  address?: string | null;
  memo?: string | null;
  photos?: WorklogPhoto[];
}

export interface WorklogPreview {
  dailyWage: number;
  workedHours: number | null;
  overtimeHours: number | null;
  amount: number;
  effectiveAmount: number;
  withholdingApplied: boolean;
  netAmount: number;
}

export interface CategoryOptionInput {
  name: string;
  defaultDailyWage?: number | null;
  defaultWithholdingApplied?: boolean;
  overtimeThresholdHours?: number;
  overtimeExtraRate?: number;
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
  defaultBreakHours?: number | null;
  defaultAddress?: string | null;
  isDayOff?: boolean;
}

export interface SortPref {
  key: string;
  dir: 'asc' | 'desc';
}

export interface QueryParams {
  year?: number;
  month?: number;
  from?: string;
  to?: string;
  category?: string;
  payStatus?: PayStatus;
  jobs?: string[];
  titleContains?: string;
  withholding?: boolean;
}

export const worklogApi = {
  titleOptions: () => api.get<WorklogTitleOption[]>('/worklog/title-options').then((r) => r.data),
  renameTitleOption: (id: number, name: string) => api.post<WorklogTitleOption>(`/worklog/title-options/${id}/update`, { name }).then((r) => r.data),
  deleteTitleOption: (id: number) => api.post(`/worklog/title-options/${id}/delete`).then((r) => r.data),

  search: (year: number, month: number) =>
    api.post<{ records: WorklogRecord[]; summary: WorklogSummary }>('/worklog/search', { year, month }).then((r) => r.data),

  query: (params: QueryParams) =>
    api.post<{ records: WorklogRecord[]; summary: WorklogSummary }>('/worklog/query', params).then((r) => r.data),

  preview: (dto: Partial<WorklogInput>) => api.post<WorklogPreview>('/worklog/preview', dto).then((r) => r.data),

  create: (dto: WorklogInput) => api.post<WorklogRecord>('/worklog', dto).then((r) => r.data),

  update: (id: number, dto: Partial<WorklogInput>) => api.post<WorklogRecord>(`/worklog/${id}/update`, dto).then((r) => r.data),

  delete: (id: number) => api.post(`/worklog/${id}/delete`).then((r) => r.data),

  categoryOptions: () => api.get<WorklogCategoryOption[]>('/worklog/category-options').then((r) => r.data),
  createCategoryOption: (dto: CategoryOptionInput) => api.post<WorklogCategoryOption>('/worklog/category-options', dto).then((r) => r.data),
  updateCategoryOption: (dto: Partial<CategoryOptionInput> & { id: number }) =>
    api.post<WorklogCategoryOption>('/worklog/category-options/update', dto).then((r) => r.data),
  reorderCategoryOptions: (ids: number[]) => api.post('/worklog/category-options/reorder', { ids }).then((r) => r.data),
  deleteCategoryOption: (id: number) => api.post(`/worklog/category-options/${id}/delete`).then((r) => r.data),

  jobOptions: () => api.get<WorklogJobOption[]>('/worklog/job-options').then((r) => r.data),
  createJobOption: (name: string, category: string) => api.post<WorklogJobOption>('/worklog/job-options', { name, category }).then((r) => r.data),
  renameJobOption: (id: number, name: string) => api.post<WorklogJobOption>(`/worklog/job-options/${id}/update`, { name }).then((r) => r.data),
  deleteJobOption: (id: number) => api.post(`/worklog/job-options/${id}/delete`).then((r) => r.data),

  uploadPhotos: (files: { uri: string; name: string; type: string }[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('photos', f as unknown as Blob));
    return api
      .post<{ photos: WorklogPhoto[] }>('/worklog/upload-photos', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 })
      .then((r) => r.data.photos);
  },
};
