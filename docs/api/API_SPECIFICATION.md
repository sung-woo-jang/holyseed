# Living Craft API 명세서

> 이 문서는 프론트엔드 페이지 분석을 기반으로 작성된 API 명세서입니다.
> 각 API에 `[사용 페이지]`를 표시하여 어디서 사용하는지 명시합니다.


---

## 목차

1. [인증 API](#1-인증-api)
2. [서비스 API](#2-서비스-api)
3. [포트폴리오 API](#3-포트폴리오-api)
4. [예약 API](#4-예약-api)
5. [리뷰 API](#5-리뷰-api)
6. [사용자 API](#6-사용자-api)
7. [백오피스 API](#7-백오피스-api)

---

## 공통 사항

### Base URL

```
개발: http://localhost:8000/api
운영: https://api.living-craft.com/api
```

### 인증 헤더

```
Authorization: Bearer {accessToken}
```

### 공통 응답 형식

모든 API 응답은 `SuccessResponse<T>` 구조로 래핑됩니다:

```typescript
interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;              // 각 API별 실제 데이터
  timestamp: string;    // ISO 8601
}
```

> 이하 각 API의 Response 타입은 `SuccessResponse.data`에 들어가는 내용만 정의합니다.

### 에러 응답 형식

```json
{
  "success": false,
  "error": "BadRequestException",
  "message": "잘못된 요청입니다.",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/..."
}
```

---

## 1. 인증 API

> 나중에 개발 예정. Apps-in-Toss appLogin 사용.

### 1.1 토스 로그인

`[/unauthorized]`

토스 앱에서 받은 인가 코드로 로그인합니다.

```
POST /api/auth/login
```

**Request Body**

```typescript
interface LoginRequest {
  authorizationCode: string;
  referrer: 'DEFAULT' | 'SANDBOX';
}
```

```json
// Example
{
  "authorizationCode": "abc123xyz",
  "referrer": "DEFAULT"
}
```

**Response**

```typescript
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    phone: string;
    createdAt: string;
  };
}
```

```json
// Example
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "홍길동",
    "phone": "010-1234-5678",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 1.2 토큰 갱신

```
POST /api/auth/refresh
```

**Request Body**

```typescript
interface RefreshRequest {
  refreshToken: string;
}
```

**Response**

```typescript
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
```

### 1.3 로그아웃

```
POST /api/auth/logout
```

**Headers**: `Authorization: Bearer {accessToken}`

**Response**: 없음 (HTTP 200만 반환)

---

## 2. 서비스 API

### 2.1 서비스 목록 조회

`[/, /reservation/service]`

서비스 목록, 지역 정보, 지역별 기본 비용을 함께 조회합니다.

```
GET /api/services
```

**Response**

```typescript
interface City {
  id: string;
  name: string;
  estimateFee: number | null;  // null이면 지역 기본 비용 적용
}

interface ServiceableRegion {
  id: string;
  name: string;
  estimateFee: number;  // 해당 지역 기본 출장 비용
  cities: City[];
}

interface Service {
  id: string;
  title: string;                    // 서비스명
  description: string;
  iconName: string;                 // TDS 아이콘 이름
  iconBgColor: string;              // 아이콘 배경색 HEX 코드
  duration: string;                 // 작업 소요 시간 (예: "하루 종일", "1-2시간")
  requiresTimeSelection: boolean;   // 시공 시간 선택 필요 여부
  serviceableRegions: ServiceableRegion[];
}

// Response: Service[]
```

**예시 응답**

```json
[
  {
    "id": "film",
    "title": "인테리어 필름",
    "description": "싱크대, 가구, 문틀 등에 필름 시공",
    "iconName": "icon-fill-color-mono",
    "iconBgColor": "#E3F2FD",
    "duration": "하루 종일",
    "requiresTimeSelection": false,
    "serviceableRegions": [
      {
        "id": "seoul",
        "name": "서울특별시",
        "estimateFee": 0,
        "cities": [
          { "id": "gangnam", "name": "강남구", "estimateFee": null },
          { "id": "gangbuk", "name": "강북구", "estimateFee": null }
        ]
      },
      {
        "id": "gyeonggi",
        "name": "경기도",
        "estimateFee": 10000,
        "cities": [
          { "id": "suwon", "name": "수원시", "estimateFee": null },
          { "id": "yongin", "name": "용인시", "estimateFee": 15000 }
        ]
      }
    ]
  }
]
```

> **참고**: 도시의 `estimateFee`가 `null`이면 해당 지역(region)의 기본 `estimateFee`를 사용합니다.

### 2.2 예약 가능 시간 조회

`[/reservation/datetime]`

특정 날짜의 예약 가능한 시간대를 조회합니다.
운영 시간은 백오피스에서 유연하게 설정 가능합니다.

```
POST /api/services/available-times
```

**Request Body**

```typescript
interface AvailableTimesRequest {
  serviceId: string;
  date: string;                        // YYYY-MM-DD
  type: 'estimate' | 'construction';   // 견적 또는 시공
}
```

```json
// Example
{
  "serviceId": "film",
  "date": "2024-01-15",
  "type": "estimate"
}
```

**Response**

```typescript
interface TimeSlot {
  time: string;       // HH:mm
  available: boolean;
}

interface AvailableTimesData {
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;   // 해당 날짜 예약 가능 여부 (휴무일이면 false)
  times: TimeSlot[];      // 가능한 시간대 목록
  defaultTime: string;    // 하루 종일 작업 시 기본 시작 시간
}
```

**예시 응답**

```json
{
  "date": "2024-01-15",
  "dayOfWeek": "월",
  "isAvailable": true,
  "times": [
    { "time": "18:00", "available": true },
    { "time": "19:00", "available": true },
    { "time": "20:00", "available": false }
  ],
  "defaultTime": "09:00"
}
```

---

## 3. 포트폴리오 API

### 3.1 포트폴리오 목록 조회

`[/, /portfolio]`

```
GET /api/portfolios
```

**Query Parameters**

| 파라미터     | 타입     | 필수 | 설명                       |
|----------|--------|----|--------------------------|
| category | string | X  | 카테고리 필터 (인테리어필름, 유리청소 등) |
| limit    | number | X  | 조회 개수 (기본: 10)           |
| offset   | number | X  | 오프셋 (페이지네이션)             |

**Response**

```typescript
interface PortfolioListItem {
  id: string;
  thumbnail: string;
  category: string;
  projectName: string;
  description: string;
  duration: string;
}

interface PortfolioListData {
  items: PortfolioListItem[];
  total: number;
}
```

**예시 응답**

```json
{
  "items": [
    {
      "id": "portfolio-1",
      "thumbnail": "https://example.com/images/portfolio1.jpg",
      "category": "인테리어필름",
      "projectName": "강남 카페 인테리어",
      "description": "모던한 분위기의 카페 인테리어 필름 시공",
      "duration": "2일"
    }
  ],
  "total": 15
}
```

### 3.2 포트폴리오 상세 조회

`[/portfolio/:id]`

```
GET /api/portfolios/:id
```

**Response**

```typescript
interface PortfolioDetail {
  id: string;
  category: string;
  projectName: string;
  client: string;
  duration: string;
  detailedDescription: string;
  images: string[];
  tags: string[];
  relatedServiceId: string;
}
```

**예시 응답**

```json
{
  "id": "portfolio-1",
  "category": "인테리어필름",
  "projectName": "강남 카페 인테리어",
  "client": "카페 이름",
  "duration": "2일",
  "detailedDescription": "모던한 분위기의 카페 인테리어 필름 시공 작업입니다.",
  "images": [
    "https://example.com/images/portfolio1-1.jpg",
    "https://example.com/images/portfolio1-2.jpg"
  ],
  "tags": ["카페", "모던", "인테리어필름"],
  "relatedServiceId": "film"
}
```

---

## 4. 예약 API

### 4.1 예약 생성

`[/reservation/confirmation]`

```
POST /api/reservations
```

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**

```typescript
interface CreateReservationRequest {
  serviceId: string;
  estimateDate: string;          // YYYY-MM-DD
  estimateTime: string;          // HH:mm
  constructionDate: string;      // YYYY-MM-DD
  constructionTime: string | null; // HH:mm 또는 하루 종일 작업이면 null
  address: string;               // 도로명 주소
  detailAddress: string;
  customerName: string;
  customerPhone: string;
  memo: string;
  photos: string[];              // 첨부 사진 URL 배열 (사전 업로드 후 URL 전달)
}
```

```json
// Example
{
  "serviceId": "film",
  "estimateDate": "2024-01-15",
  "estimateTime": "14:00",
  "constructionDate": "2024-01-20",
  "constructionTime": null,
  "address": "서울특별시 강남구 테헤란로 123",
  "detailAddress": "2층 201호",
  "customerName": "홍길동",
  "customerPhone": "010-1234-5678",
  "memo": "주차 가능합니다.",
  "photos": [
    "https://example.com/uploads/photo1.jpg",
    "https://example.com/uploads/photo2.jpg"
  ]
}
```

**Response**

```typescript
type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface CreateReservationData {
  id: string;
  reservationNumber: string;
  status: ReservationStatus;
  createdAt: string;          // ISO 8601
}
```

**예시 응답**

```json
{
  "id": "reservation-123",
  "reservationNumber": "R2024011500001",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 4.2 예약 상세 조회

`[/reviews/write/:reservationId]`

```
GET /api/reservations/:id
```

**Headers**: `Authorization: Bearer {accessToken}`

**Response**

```typescript
interface ReservationDetail {
  id: string;
  reservationNumber: string;
  service: {
    id: string;
    title: string;
  };
  estimateDate: string;        // YYYY-MM-DD
  estimateTime: string;        // HH:mm
  constructionDate: string;    // YYYY-MM-DD
  constructionTime: string | null;
  address: string;
  detailAddress: string;
  customerName: string;
  customerPhone: string;
  status: ReservationStatus;   // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  canCancel: boolean;
  canReview: boolean;
  createdAt: string;           // ISO 8601
}
```

**예시 응답**

```json
{
  "id": "reservation-123",
  "reservationNumber": "R2024011500001",
  "service": { "id": "film", "title": "인테리어 필름" },
  "estimateDate": "2024-01-15",
  "estimateTime": "14:00",
  "constructionDate": "2024-01-20",
  "constructionTime": null,
  "address": "서울특별시 강남구 테헤란로 123",
  "detailAddress": "2층 201호",
  "customerName": "홍길동",
  "customerPhone": "010-1234-5678",
  "status": "confirmed",
  "canCancel": true,
  "canReview": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 4.3 예약 취소

`[/my/reservations]`

```
POST /api/reservations/:id/cancel
```

**Headers**: `Authorization: Bearer {accessToken}`

**Response**: 없음 (SuccessResponse의 message로 "예약이 취소되었습니다." 반환)

---

## 5. 리뷰 API

### 5.1 리뷰 목록 조회

`[/, /reviews]`

```
GET /api/reviews
```

**Query Parameters**

| 파라미터      | 타입     | 필수 | 설명             |
|-----------|--------|----|----------------|
| rating    | number | X  | 평점 필터 (1-5)    |
| serviceId | string | X  | 서비스 ID 필터      |
| limit     | number | X  | 조회 개수 (기본: 10) |
| offset    | number | X  | 오프셋 (페이지네이션)   |

**Response**

```typescript
interface ReviewListItem {
  id: string;
  serviceName: string;
  rating: number;          // 1-5
  comment: string;
  userName: string;
  createdAt: string;       // ISO 8601
}

interface ReviewListData {
  items: ReviewListItem[];
  total: number;
}
```

**예시 응답**

```json
{
  "items": [
    {
      "id": "review-1",
      "serviceName": "인테리어 필름",
      "rating": 5,
      "comment": "깔끔하게 시공해주셨습니다. 만족합니다!",
      "userName": "홍*동",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 25
}
```

### 5.2 리뷰 작성

`[/reviews/write/:reservationId]`

```
POST /api/reviews
```

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**

```typescript
interface CreateReviewRequest {
  reservationId: string;
  rating: number;          // 1-5
  comment: string;
}
```

```json
// Example
{
  "reservationId": "reservation-123",
  "rating": 5,
  "comment": "깔끔하게 시공해주셨습니다. 만족합니다!"
}
```

**Response**

```typescript
interface CreateReviewData {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;     // ISO 8601
}
```

**예시 응답**

```json
{
  "id": "review-1",
  "rating": 5,
  "comment": "깔끔하게 시공해주셨습니다. 만족합니다!",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 6. 사용자 API

### 6.1 내 정보 조회

`[/my]`

```
GET /api/users/me
```

**Headers**: `Authorization: Bearer {accessToken}`

**Response**

```typescript
interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;     // ISO 8601
}
```

**예시 응답**

```json
{
  "id": "user-123",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "hong@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 6.2 내 예약 목록 조회

`[/my/reservations]`

```
GET /api/users/me/reservations
```

**Headers**: `Authorization: Bearer {accessToken}`

**Query Parameters**

| 파라미터   | 타입     | 필수 | 설명                                      |
|--------|--------|----|-----------------------------------------|
| status | string | X  | 상태 필터 (confirmed, completed, cancelled) |

**Response**

```typescript
interface MyReservationListItem {
  id: string;
  reservationNumber: string;
  serviceName: string;
  estimateDate: string;        // YYYY-MM-DD
  estimateTime: string;        // HH:mm
  constructionDate: string;    // YYYY-MM-DD
  constructionTime: string | null;
  status: ReservationStatus;   // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  canCancel: boolean;
  canReview: boolean;
}

// Response: MyReservationListItem[]
```

**예시 응답**

```json
[
  {
    "id": "reservation-123",
    "reservationNumber": "R2024011500001",
    "serviceName": "인테리어 필름",
    "estimateDate": "2024-01-15",
    "estimateTime": "14:00",
    "constructionDate": "2024-01-20",
    "constructionTime": null,
    "status": "confirmed",
    "canCancel": true,
    "canReview": false
  }
]
```

### 6.3 내 리뷰 목록 조회

`[/my/reviews]`

```
GET /api/users/me/reviews
```

**Headers**: `Authorization: Bearer {accessToken}`

**Response**

```typescript
interface MyReviewListItem {
  id: string;
  serviceName: string;
  rating: number;
  comment: string;
  createdAt: string;           // ISO 8601
}

// Response: MyReviewListItem[]
```

**예시 응답**

```json
[
  {
    "id": "review-1",
    "serviceName": "인테리어 필름",
    "rating": 5,
    "comment": "깔끔하게 시공해주셨습니다. 만족합니다!",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## 7. 백오피스 API

> 백오피스 전용 API입니다. 관리자 인증이 필요합니다.

### 7.1 관리자 인증

#### 관리자 로그인

```
POST /api/admin/auth/login
```

**Request Body**

```typescript
interface AdminLoginRequest {
  email: string;
  password: string;
}
```

```json
// Example
{
  "email": "admin@livingcraft.com",
  "password": "password123"
}
```

**Response**

```typescript
interface AdminLoginResponse {
  accessToken: string;
}
```

```json
// Example
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 7.2 운영 시간 설정

> 견적/시공 가능한 시간대를 유연하게 관리합니다.

#### 운영 시간 조회

```
GET /api/admin/settings/operating-hours
```

**Response**

```typescript
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface TimeSlotConfig {
  availableDays: DayOfWeek[];  // 가능한 요일
  startTime: string;           // HH:mm
  endTime: string;             // HH:mm
  slotDuration: number;        // 시간 슬롯 간격 (분)
}

interface OperatingHoursData {
  estimate: TimeSlotConfig;
  construction: TimeSlotConfig;
  holidays: string[];        // YYYY-MM-DD 형식의 휴무일 목록
}
```

**예시 응답**

```json
{
  "estimate": {
    "availableDays": ["mon", "tue", "wed", "thu", "fri"],
    "startTime": "18:00",
    "endTime": "22:00",
    "slotDuration": 60
  },
  "construction": {
    "availableDays": ["mon", "tue", "wed", "thu", "fri", "sat"],
    "startTime": "09:00",
    "endTime": "18:00",
    "slotDuration": 60
  },
  "holidays": ["2024-01-01", "2024-02-09", "2024-02-10"]
}
```

#### 운영 시간 수정

```
POST /api/admin/settings/operating-hours
```

**Request Body**

```typescript
interface UpdateOperatingHoursRequest {
  estimate: Omit<TimeSlotConfig, 'slotDuration'>;
  construction: Omit<TimeSlotConfig, 'slotDuration'>;
}
```

```json
// Example
{
  "estimate": {
    "availableDays": [
      "mon",
      "tue",
      "wed",
      "thu",
      "fri"
    ],
    "startTime": "18:00",
    "endTime": "22:00"
  },
  "construction": {
    "availableDays": [
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat"
    ],
    "startTime": "09:00",
    "endTime": "18:00"
  }
}
```

#### 휴무일 추가

```
POST /api/admin/settings/holidays
```

**Request Body**

```typescript
interface AddHolidayRequest {
  date: string;      // YYYY-MM-DD
  reason: string;
}
```

```json
// Example
{
  "date": "2024-01-15",
  "reason": "개인 휴가"
}
```

#### 휴무일 삭제

```
POST /api/admin/settings/holidays/:date/delete
```

**Response**: 없음 (SuccessResponse의 message로 결과 반환)

---

### 7.3 예약 관리

#### 전체 예약 목록 조회

```
GET /api/admin/reservations
```

**Query Parameters**

| 파라미터      | 타입     | 필수 | 설명             |
|-----------|--------|----|----------------|
| status    | string | X  | 상태 필터          |
| startDate | string | X  | 시작 날짜          |
| endDate   | string | X  | 종료 날짜          |
| search    | string | X  | 검색어 (이름, 전화번호) |

**Response**

```typescript
interface AdminReservationListItem {
  id: string;
  reservationNumber: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  estimateDate: string;        // YYYY-MM-DD
  estimateTime: string;        // HH:mm
  constructionDate: string;    // YYYY-MM-DD
  constructionTime: string | null;
  address: string;
  status: ReservationStatus;   // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string;           // ISO 8601
}

interface AdminReservationListData {
  items: AdminReservationListItem[];
  total: number;
}
```

**예시 응답**

```json
{
  "items": [
    {
      "id": "reservation-123",
      "reservationNumber": "R2024011500001",
      "customerName": "홍길동",
      "customerPhone": "010-1234-5678",
      "serviceName": "인테리어 필름",
      "estimateDate": "2024-01-15",
      "estimateTime": "14:00",
      "constructionDate": "2024-01-20",
      "constructionTime": null,
      "address": "서울특별시 강남구 테헤란로 123",
      "status": "confirmed",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 50
}
```

#### 예약 상태 변경

```
POST /api/admin/reservations/:id/status
```

**Request Body**

```typescript
interface UpdateReservationStatusRequest {
  status: 'confirmed' | 'completed' | 'cancelled';
}
```

```json
// Example
{
  "status": "confirmed"
}
```

**Response**: 없음 (SuccessResponse의 message로 결과 반환)

#### 예약 취소 (관리자)

```
POST /api/admin/reservations/:id/cancel
```

**Response**: 없음 (SuccessResponse의 message로 "예약이 취소되었습니다." 반환)

---

### 7.4 서비스 관리

#### 서비스 목록 조회

```
GET /api/admin/services
```

**Response**

```typescript
// Response: Service[] (Service 인터페이스는 2.1 참조)
```

#### 서비스 생성

```
POST /api/admin/services
```

**Request Body**

```typescript
interface CreateServiceRequest {
  title: string;
  description: string;
  iconName: string;
  iconBgColor: string;
  duration: string;
  requiresTimeSelection: boolean;
  serviceableRegions: {
    regionId: string;
    cityIds: string[];
  }[];
}
```

```json
// Example
{
  "title": "인테리어 필름",
  "description": "고급 인테리어 필름 시공 서비스입니다.",
  "iconName": "film",
  "iconBgColor": "#E3F2FD",
  "duration": "2-3시간",
  "requiresTimeSelection": false,
  "serviceableRegions": [
    {
      "regionId": "seoul",
      "cityIds": [
        "gangnam-gu",
        "seocho-gu",
        "songpa-gu"
      ]
    }
  ]
}
```

#### 서비스 수정

```
POST /api/admin/services/:id
```

**Request Body**: `CreateServiceRequest`와 동일

**Response**: 없음 (SuccessResponse의 message로 결과 반환)

#### 서비스 삭제

```
POST /api/admin/services/:id/delete
```

**Response**: 없음 (SuccessResponse의 message로 "서비스가 삭제되었습니다." 반환)

---

### 7.5 포트폴리오 관리

#### 포트폴리오 목록 조회

```
GET /api/admin/portfolios
```

**Response**

```typescript
interface AdminPortfolioListData {
  items: PortfolioListItem[];  // PortfolioListItem 인터페이스는 3.1 참조
  total: number;
}
```

#### 포트폴리오 생성

```
POST /api/admin/portfolios
```

**Request Body**

```typescript
interface CreatePortfolioRequest {
  category: string;
  projectName: string;
  client: string;
  duration: string;
  description: string;
  detailedDescription: string;
  images: string[];
  tags: string[];
  relatedServiceId: string;
}
```

```json
// Example
{
  "category": "인테리어필름",
  "projectName": "강남 카페 인테리어",
  "client": "카페 이름",
  "duration": "2일",
  "description": "모던한 분위기의 카페 인테리어 필름 시공",
  "detailedDescription": "모던한 분위기의 카페 인테리어 필름 시공 작업입니다. 대리석 패턴의 필름을 적용하여 고급스러운 느낌을 연출했습니다.",
  "images": [
    "https://example.com/images/portfolio1-1.jpg",
    "https://example.com/images/portfolio1-2.jpg"
  ],
  "tags": [
    "카페",
    "모던",
    "인테리어필름"
  ],
  "relatedServiceId": "film"
}
```

#### 포트폴리오 수정

```
POST /api/admin/portfolios/:id
```

**Request Body**: `CreatePortfolioRequest`와 동일

**Response**: 없음 (SuccessResponse의 message로 결과 반환)

#### 포트폴리오 삭제

```
POST /api/admin/portfolios/:id/delete
```

**Response**: 없음 (SuccessResponse의 message로 "포트폴리오가 삭제되었습니다." 반환)

---

### 7.6 리뷰 관리

#### 리뷰 목록 조회

```
GET /api/admin/reviews
```

**Query Parameters**

| 파라미터      | 타입     | 필수 | 설명     |
|-----------|--------|----|--------|
| rating    | number | X  | 평점 필터  |
| serviceId | string | X  | 서비스 ID |

#### 리뷰 삭제

```
POST /api/admin/reviews/:id/delete
```

**Response**: 없음 (SuccessResponse의 message로 "리뷰가 삭제되었습니다." 반환)

---

### 7.7 고객 관리

#### 고객 목록 조회

```
GET /api/admin/customers
```

**Query Parameters**

| 파라미터   | 타입     | 필수 | 설명             |
|--------|--------|----|----------------|
| search | string | X  | 검색어 (이름, 전화번호) |

**Response**

```typescript
interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  totalReservations: number;
  totalReviews: number;
  createdAt: string;           // ISO 8601
}

interface CustomerListData {
  items: CustomerListItem[];
  total: number;
}
```

**예시 응답**

```json
{
  "items": [
    {
      "id": "user-123",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "totalReservations": 5,
      "totalReviews": 3,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100
}
```

#### 고객 상세 조회

```
GET /api/admin/customers/:id
```

**Response**

```typescript
interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string;
  reservations: MyReservationListItem[];  // 6.2 참조
  reviews: MyReviewListItem[];            // 6.3 참조
  createdAt: string;                      // ISO 8601
}
```

**예시 응답**

```json
{
  "id": "user-123",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "hong@example.com",
  "reservations": [
    {
      "id": "reservation-123",
      "reservationNumber": "R2024011500001",
      "serviceName": "인테리어 필름",
      "estimateDate": "2024-01-15",
      "estimateTime": "14:00",
      "constructionDate": "2024-01-20",
      "constructionTime": null,
      "status": "completed",
      "canCancel": false,
      "canReview": true
    }
  ],
  "reviews": [
    {
      "id": "review-1",
      "serviceName": "인테리어 필름",
      "rating": 5,
      "comment": "깔끔하게 시공해주셨습니다.",
      "createdAt": "2024-01-21T10:00:00Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 부록: 주소 검색 API

> 네이버 주소 API 또는 카카오 주소 API 사용 권장

### 주소 검색 (프록시)

`[/reservation/service]`

외부 API를 프록시하여 CORS 문제를 해결합니다.

```
GET /api/address/search?query=강남구
```

**Response**

```typescript
interface AddressSearchResult {
  roadAddress: string;   // 도로명 주소
  jibunAddress: string;  // 지번 주소
  zipCode: string;       // 우편번호
}

// Response: AddressSearchResult[]
```

**예시 응답**

```json
[
  {
    "roadAddress": "서울특별시 강남구 테헤란로 123",
    "jibunAddress": "서울특별시 강남구 역삼동 123-45",
    "zipCode": "06130"
  }
]
```
