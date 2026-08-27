import { labApi } from '../lib/lab-api';

export type PayStatus = 'RECEIVED' | 'EXPECTED' | 'UNPAID' | 'DAYOFF';

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
  withholdingApplied: boolean;
  effectiveAmount: number;
  netAmount: number;
}

export interface WorklogSummary {
  workDays: number;
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
}

export interface WorklogInput {
  title: string;
  workDate: string;
  startTime?: string;
  endTime?: string;
  breakHours?: number;
  payStatus?: PayStatus;
  category?: string;
  dailyWage?: number;
  amountOverride?: number | null;
  withholdingApplied?: boolean;
  memo?: string;
}

export const labWorklogApi = {
  search: (year: number, month: number) =>
    labApi.post<{ records: WorklogRecord[]; summary: WorklogSummary }>('/worklog/search', { year, month }).then((r) => r.data),

  create: (dto: WorklogInput) => labApi.post<WorklogRecord>('/worklog', dto).then((r) => r.data),

  update: (id: number, dto: Partial<WorklogInput>) => labApi.post<WorklogRecord>(`/worklog/${id}/update`, dto).then((r) => r.data),

  delete: (id: number) => labApi.post(`/worklog/${id}/delete`).then((r) => r.data),

  categoryOptions: () => labApi.get<WorklogCategoryOption[]>('/worklog/category-options').then((r) => r.data),
};
