// 카탈로그

export interface Category {
  id: number
  code: string
  name: string
  intro: string
  color: string
  imageUrl?: string | null
  sortOrder: number
  isActive: boolean
}

export interface ProductFeature {
  id: number
  label: string
  sortOrder: number
}

export interface ProductColor {
  id: number
  label: string
  sortOrder: number
}

export interface Product {
  id: number
  code: string
  brand: string
  name: string
  spec: string
  price: number
  illustKind: string
  imageUrl?: string | null
  description: string
  sortOrder: number
  isActive: boolean
  features: ProductFeature[]
  colors: ProductColor[]
}

export interface ProductGroup {
  id: number
  code: string
  label: string
  description: string
  sortOrder: number
  products: Product[]
}

export interface ServiceItem {
  id: number
  code: string
  name: string
  description: string
  price: number
  unit: string
  duration: string
  illustKind: string
  imageUrl?: string | null
  sortOrder: number
  isFeatured: boolean
  isActive: boolean
  categoryId: number
  productGroups: ProductGroup[]
}

export interface FullCatalog {
  categories: (Category & { items: ServiceItem[] })[]
}

// 시공사례

export interface CaseTag {
  id: number
  tag: string
}

export interface CasePhoto {
  id: number
  fileUrl: string
  role: 'cover' | 'before' | 'after'
  label: string
  sortOrder: number
}

export interface Case {
  id: number
  title: string
  area: string
  hours: number
  dateText: string
  color: string
  intro: string
  story: string
  isPublished: boolean
  sortOrder: number
  tags: CaseTag[]
  photos: CasePhoto[]
}

// 견적 요청

export type QuoteStatus = 'pending' | 'accepted' | 'in_progress' | 'done' | 'cancelled'

export interface QuoteRequestItem {
  id: number
  itemCode: string
  nameSnapshot: string
  unitSnapshot: string
  priceSnapshot: number
  productCode: string | null
  productSnapshot: Record<string, unknown> | null
}

export interface QuoteRequest {
  id: number
  code: string
  status: QuoteStatus
  contactName: string
  contactPhone: string
  contactAddress: string
  memo: string
  prefDate: string
  prefTimeSlot: string
  visitFee: number
  itemsTotal: number
  createdAt: string
  items: QuoteRequestItem[]
}

// 일정

export type SlotStatus = 'open' | 'busy' | 'off'

export interface ScheduleSlots {
  am: SlotStatus
  noon: SlotStatus
  pm: SlotStatus
  eve: SlotStatus
}

export interface ScheduleDay extends ScheduleSlots {
  date: string
  note: string | null
}

// 시공일지

export type JobStatus = '문의접수' | '시공대기' | '시공완료'

export interface JobPhoto {
  id: number
  role: 'before' | 'after'
  label: string
  fileUrl: string | null
  sortOrder: number
}

export interface Job {
  id: string
  isPublished: boolean
  customerName?: string
  phone?: string
  addressFull?: string
  addressShort?: string
  inquiryDate?: string
  workDate?: string
  status?: JobStatus
  productName?: string
  brand?: string
  model?: string
  requestNote?: string
  workSummary?: string
  // admin-only
  sellingPrice?: number
  costPrice?: number
  materialSource?: string
  paid?: boolean
  paidDate?: string
  internalMemo?: string
  publicFields?: string[]
  beforePhotos?: JobPhoto[]
  afterPhotos?: JobPhoto[]
}

// 장바구니 아이템

export interface CartItem {
  serviceItemCode: string
  serviceItemName: string
  serviceItemPrice: number
  serviceItemUnit: string
  productCode: string | null
  productName: string | null
  productPrice: number
  productBrand: string | null
}
