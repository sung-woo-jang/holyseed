// ===== Couple =====
export interface WeddingVenue {
  name: string
  address: string
  lat?: number
  lng?: number
  hall?: string
  floor?: string
}

export interface AccountInfo {
  bank: string
  account: string
  holder: string
  relation: string
}

export interface ThemeSettings {
  primaryColor?: string
  fontFamily?: string
  [key: string]: string | undefined
}

export interface Couple {
  id: string
  slug: string
  groomName: string
  brideName: string
  weddingDate?: string
  weddingVenue?: WeddingVenue
  accountInfo: AccountInfo[]
  themeSettings: ThemeSettings
  createdAt: string
  updatedAt: string
}

// ===== Auth =====
export interface WeddingUser {
  id: string
  email: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  coupleId: string
}

export interface AuthResponse {
  accessToken: string
  user: WeddingUser
  couple: { id: string; slug: string } | null
}

// ===== Media =====
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface Media {
  id: string
  coupleId: string
  localOriginalPath?: string
  localResizedPath?: string
  localThumbnailPath?: string
  processingStatus: ProcessingStatus
  moderationStatus: ModerationStatus
  uploaderName?: string
  message?: string
  fileType: string
  fileSize: number
  width?: number
  height?: number
  duration?: number
  createdAt: string
  updatedAt: string
}

export interface MediaStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface MediaSearchResult {
  media: Media[]
  total: number
  stats: MediaStats
}

// ===== Attendance =====
export type AttendanceStatus = 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'

export interface Attendance {
  id: string
  coupleId: string
  guestName: string
  guestCount: number
  attendanceStatus: AttendanceStatus
  message?: string
  phoneNumber?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceStats {
  total: number
  attending: number
  notAttending: number
  maybe: number
  totalGuests: number
}

export interface AttendanceSearchResult {
  attendances: Attendance[]
  total: number
  stats: AttendanceStats
}

// ===== ContentRow =====
export type ContentRowType = 'TOP_RANKED' | 'IMAGE_GALLERY' | 'VIDEO_GALLERY'

export interface BaseContentItem {
  type: 'top-ranked' | 'image' | 'video'
  src: string
  alt: string
  order: number
  mediaId?: string
}

export interface TopRankedItem extends BaseContentItem {
  type: 'top-ranked'
  rank: number
}

export interface ImageItem extends BaseContentItem {
  type: 'image'
  caption?: string
}

export interface VideoItem extends BaseContentItem {
  type: 'video'
  poster?: string
}

export type ContentItem = TopRankedItem | ImageItem | VideoItem

export interface ContentRow {
  id: string
  coupleId: string
  title: string
  rowType: ContentRowType
  order: number
  isVisible: boolean
  items: ContentItem[]
  createdAt: string
  updatedAt: string
}

// ===== serialized media URL helpers =====
export function mediaThumbnailUrl(id: string): string {
  return `/api/wedding/media/${id}/thumbnail`
}

export function mediaResizedUrl(id: string): string {
  return `/api/wedding/media/${id}/resized`
}

export function mediaOriginalUrl(id: string): string {
  return `/api/wedding/media/${id}/original`
}
