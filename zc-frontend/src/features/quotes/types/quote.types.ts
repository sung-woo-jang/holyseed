export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

// 견적서 항목
export interface QuoteItem {
  id: string;
  productModelId?: string;
  productName: string;
  quantity: number;
  materialPrice: number;  // 자재 단가
  laborPrice: number;     // 시공비 단가
  unitPrice: number;      // = materialPrice + laborPrice
  totalPrice: number;
  note?: string;
  sortOrder: number;
}

// 견적서
export interface Quote {
  id: string;
  title: string;
  customerName?: string;
  customerPhone?: string;
  memo?: string;
  totalAmount: number;
  materialSubtotal?: number;  // derived
  laborSubtotal?: number;     // derived
  status: QuoteStatus;
  validUntil?: string;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

// 견적서 목록 응답
export interface QuoteListResponse {
  items: Quote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 견적서 쿼리 파라미터
export interface QuoteQueryParams {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  search?: string;
}

// 견적서 생성 DTO
export interface CreateQuoteDto {
  title: string;
  customerName?: string;
  customerPhone?: string;
  memo?: string;
  validUntil?: string;
  items?: CreateQuoteItemDto[];
}

// 견적서 수정 DTO
export interface UpdateQuoteDto {
  title?: string;
  customerName?: string;
  customerPhone?: string;
  memo?: string;
  validUntil?: string;
}

// 견적서 항목 생성 DTO
export interface CreateQuoteItemDto {
  productModelId?: string;
  productName: string;
  quantity: number;
  materialPrice?: number;  // 미입력 시 모델에서 자동 계산
  laborPrice?: number;     // 미입력 시 모델에서 자동 채움
  unitPrice?: number;      // materialPrice/laborPrice 없을 때 폴백
  note?: string;
  sortOrder?: number;
}

// 견적서 항목 수정 DTO
export interface UpdateQuoteItemDto {
  productName?: string;
  quantity?: number;
  materialPrice?: number;
  laborPrice?: number;
  unitPrice?: number;
  note?: string;
  sortOrder?: number;
}
