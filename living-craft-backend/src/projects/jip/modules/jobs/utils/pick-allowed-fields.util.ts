import { Job } from '../entities/job.entity';
import { JobPhoto } from '../entities/job-photo.entity';

// 절대 비공개 필드 — public_fields에 어떻게 넣어도 항상 차단
const INTERNAL_KEYS = new Set(['sellingPrice', 'costPrice', 'materialSource', 'paid', 'paidDate', 'internalMemo']);

// DB 컬럼명(camelCase) → public_fields 키 매핑 (data-jobs.jsx의 JOB_FIELDS key 기준)
const FIELD_ALIAS: Record<string, string> = {
  customerName: 'customer_name',
  phone: 'phone',
  addressFull: 'address_full',
  addressShort: 'address_short',
  inquiryDate: 'inquiry_date',
  workDate: 'work_date',
  status: 'status',
  productName: 'product_name',
  brand: 'brand',
  model: 'model',
  requestNote: 'request_note',
  workSummary: 'work_summary',
};

export interface PublicJob {
  id: string;
  isPublished: boolean;
  [key: string]: any;
  photos?: Array<{ role: string; label: string; fileUrl: string }>;
}

export function pickAllowedFields(job: Job & { photos?: JobPhoto[] }): PublicJob {
  const allowed = new Set(job.publicFields || []);
  const result: PublicJob = { id: job.id, isPublished: job.isPublished };

  for (const [camel, alias] of Object.entries(FIELD_ALIAS)) {
    if (INTERNAL_KEYS.has(camel)) continue;
    if (!allowed.has(alias)) continue;
    result[camel] = (job as any)[camel];
  }

  // 사진은 role별로 분리
  if (job.photos) {
    if (allowed.has('before_photos')) {
      result['beforePhotos'] = job.photos.filter((p) => p.role === 'before').map((p) => ({ role: p.role, label: p.label, fileUrl: p.fileUrl }));
    }
    if (allowed.has('after_photos')) {
      result['afterPhotos'] = job.photos.filter((p) => p.role === 'after').map((p) => ({ role: p.role, label: p.label, fileUrl: p.fileUrl }));
    }
  }

  return result;
}
