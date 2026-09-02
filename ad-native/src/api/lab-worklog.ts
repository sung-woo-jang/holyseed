import { labApi } from '../lib/lab-api';

export type PayStatus = 'RECEIVED' | 'EXPECTED' | 'UNPAID' | 'DAYOFF';

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
  halfPay: boolean;
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
}

export interface WorklogJobOption {
  id: number;
  name: string;
  category: string;
}

export interface WorklogInput {
  title: string;
  workDate: string;
  startTime?: string;
  endTime?: string;
  breakHours?: number;
  jobs?: string[];
  payStatus?: PayStatus;
  category?: string;
  dailyWage?: number;
  amountOverride?: number | null;
  withholdingApplied?: boolean;
  halfPay?: boolean;
  address?: string;
  memo?: string;
  photos?: WorklogPhoto[];
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

export const labWorklogApi = {
  search: (year: number, month: number) =>
    labApi.post<{ records: WorklogRecord[]; summary: WorklogSummary }>('/worklog/search', { year, month }).then((r) => r.data),

  query: (params: QueryParams) =>
    labApi.post<{ records: WorklogRecord[]; summary: WorklogSummary }>('/worklog/query', params).then((r) => r.data),

  create: (dto: WorklogInput) => labApi.post<WorklogRecord>('/worklog', dto).then((r) => r.data),

  update: (id: number, dto: Partial<WorklogInput>) => labApi.post<WorklogRecord>(`/worklog/${id}/update`, dto).then((r) => r.data),

  delete: (id: number) => labApi.post(`/worklog/${id}/delete`).then((r) => r.data),

  categoryOptions: () => labApi.get<WorklogCategoryOption[]>('/worklog/category-options').then((r) => r.data),
  createCategoryOption: (dto: CategoryOptionInput) => labApi.post<WorklogCategoryOption>('/worklog/category-options', dto).then((r) => r.data),
  updateCategoryOption: (dto: Partial<CategoryOptionInput> & { id: number }) =>
    labApi.post<WorklogCategoryOption>('/worklog/category-options/update', dto).then((r) => r.data),
  reorderCategoryOptions: (ids: number[]) => labApi.post('/worklog/category-options/reorder', { ids }).then((r) => r.data),

  jobOptions: () => labApi.get<WorklogJobOption[]>('/worklog/job-options').then((r) => r.data),
  createJobOption: (name: string, category: string) => labApi.post<WorklogJobOption>('/worklog/job-options', { name, category }).then((r) => r.data),
  deleteJobOption: (id: number) => labApi.post(`/worklog/job-options/${id}/delete`).then((r) => r.data),

  uploadPhotos: (files: { uri: string; name: string; type: string }[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('photos', f as unknown as Blob));
    return labApi
      .post<{ photos: WorklogPhoto[] }>('/worklog/upload-photos', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 })
      .then((r) => r.data.photos);
  },
};
