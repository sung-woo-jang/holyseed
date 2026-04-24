# ZC 크롤러 운영 가이드

ZC 프로젝트를 위한 제품 정보 크롤링 시스템입니다.

## 목차

1. [개요](#개요)
2. [지원 사이트](#지원-사이트)
3. [사용법](#사용법)
4. [타겟 카테고리](#타겟-카테고리)
5. [새 사이트 추가 방법](#새-사이트-추가-방법)
6. [문제 해결](#문제-해결)

---

## 개요

### 목적

ZC 사업에 필요한 제품 정보를 자동으로 수집하여 데이터베이스에 저장합니다.

### 수집 정보

- **카테고리**: 제품 분류 체계
- **제품 기본 정보**: 제품명, 브랜드, 모델명, 가격
- **제품 이미지**: 썸네일 URL
- **제품 상세**: 스펙, 설명 등

### 데이터베이스

- **스키마**: `zc`
- **주요 테이블**:
  - `sites`: 크롤링 사이트 정보
  - `site_categories`: 사이트별 카테고리
  - `brands`: 제품 브랜드
  - `product_models`: 제품 모델 (브랜드별 정규화된 모델명)
  - `product_listings`: 제품 목록 (사이트별 가격 정보)

---

## 지원 사이트

### 1. 다시스 (Dasis)

- **URL**: https://www.dasis.co.kr
- **특징**:
  - 로그인 필요 (쿠키 기반 인증)
  - 욕실/주방 제품 위주
  - 카테고리 계층 구조 (3단계)

**주요 카테고리**:

| 코드 | 분류 | 제품 |
|------|------|------|
| 002xxx | 양변기 | 원피스, 투피스, 비데, 부품, 시트 |
| 003xxx | 세면대 | 반다리, 긴다리, 탑볼, 부품 |
| 004xxx | 수전 | 세면수전, 샤워수전, 해바라기, 샤워겸용, 주방수전 |
| 007xxx | 욕실장 | 욕실장, 슬라이딩장, 플랩장, 하부장 |

### 2. 우리욕실 (Wooribath)

- **URL**: https://www.wooribath.co.kr
- **특징**:
  - 로그인 불필요
  - 욕실 제품 위주
  - 악세사리/부속품 풍부

**주요 카테고리**:

| 코드 | 분류 |
|------|------|
| 328 | 양변기/비데 |
| 76 | 세면대 |
| 135 | 수전 |
| 223 | 악세사리 |
| 209 | 슬라이드바 |
| 627 | 환풍기 |
| 386 | 거울 |
| 292 | 부속품 |

---

## 사용법

### 기본 명령어

```bash
cd living-craft-backend

# 전체 크롤링 (모든 카테고리)
npm run crawler -- --site=dasis
npm run crawler -- --site=wooribath

# 타겟 카테고리만 크롤링 (권장)
npm run crawler -- --site=dasis --target-only
npm run crawler -- --site=wooribath --target-only
```

### 고급 옵션

#### 1. 특정 카테고리 포함

```bash
# 다시스: 양변기 관련 카테고리만
npm run crawler -- --site=dasis --include=002003,002005,002007

# 우리욕실: 수전, 악세사리만
npm run crawler -- --site=wooribath --include=135,223
```

#### 2. 특정 카테고리 제외

```bash
# 다시스: 욕실장 제외
npm run crawler -- --site=dasis --exclude=007002

# 우리욕실: 부속품 제외
npm run crawler -- --site=wooribath --exclude=292
```

#### 3. 타겟 카테고리만 크롤링 (권장)

```bash
# ZC 사업 관련 제품만 수집
npm run crawler -- --site=dasis --target-only
npm run crawler -- --site=wooribath --target-only
```

### 옵션 조합

```bash
# 타겟 카테고리 중 특정 카테고리 제외
npm run crawler -- --site=dasis --target-only --exclude=007002

# 포함과 제외 동시 사용
npm run crawler -- --site=dasis --include=002,003 --exclude=003005
```

---

## 타겟 카테고리

타겟 카테고리는 `config/target-categories.ts`에 정의되어 있으며, ZC 사업과 직접 관련된 제품만 포함합니다.

### 사업 목록 vs 크롤링 데이터

| 사업 분류 | 다시스 | 우리욕실 | 커버 상태 |
|----------|--------|----------|-----------|
| **욕실** |
| 양변기 | ✅ 원피스, 투피스, 비데, 부품, 시트 | ✅ 양변기/비데 | 완전 커버 |
| 세면대 | ✅ 반다리, 긴다리, 탑볼, 부품 | ✅ 세면대 | 완전 커버 |
| 수전 | ✅ 세면, 샤워, 해바라기, 샤워겸용, 탑볼 | ✅ 수전 | 완전 커버 |
| 악세사리 | ❌ 없음 | ✅ 악세사리, 슬라이드바 | 우리욕실에서 커버 |
| 환풍기 | ❌ 없음 | ✅ 환풍기 | 우리욕실에서 커버 |
| 욕실장 | ✅ 욕실장, 슬라이딩장, 플랩장, 하부장 | ✅ 거울 | 완전 커버 |
| **주방** |
| 주방수전 | ✅ 주방수전 | ❌ 없음 | 다시스에서 커버 |
| 싱크볼 | ❌ 없음 | ❌ 없음 | **미커버** |
| 배수구 | ❌ 없음 | ❌ 없음 | **미커버** |
| 후드/인덕션 | ❌ 없음 | ❌ 없음 | **미커버** |

**결론**:
- ✅ **욕실 제품**: 완전히 커버됨 (두 사이트 조합)
- ❌ **주방 제품**: 일부만 커버 (싱크볼, 배수구, 후드 등은 추후 별도 사이트 필요)

### 타겟 카테고리 수정

타겟 카테고리를 변경하려면 `config/target-categories.ts` 파일을 수정하세요.

```typescript
// config/target-categories.ts

export const DASIS_TARGET_CATEGORIES: Record<string, string> = {
  '002003': '원피스',
  '002005': '투피스',
  // ... 추가/제거
}

export const WOORIBATH_TARGET_CATEGORIES: Record<string, string> = {
  '328': '양변기/비데',
  '76': '세면대',
  // ... 추가/제거
}
```

---

## 새 사이트 추가 방법

새로운 크롤링 사이트를 추가하는 전체 가이드입니다.

### 1단계: 사이트 분석

#### 1.1 사이트 구조 파악

```
✅ 체크리스트:
□ 로그인 필요 여부
□ 카테고리 페이지 구조
□ 제품 목록 페이지 구조
□ 제품 상세 페이지 구조
□ 페이지네이션 방식
□ Ajax/SPA 여부
□ 이미지 URL 패턴
```

#### 1.2 샘플 데이터 수집

브라우저 개발자 도구로 다음을 확인:

- 카테고리 목록 HTML 구조
- 제품 목록 HTML 구조
- 제품 상세 페이지 HTML 구조
- API 엔드포인트 (있는 경우)

### 2단계: 디렉토리 생성

```bash
cd src/projects/zc/scripts/crawler/sites
mkdir new-site
cd new-site
```

### 3단계: 파일 생성

#### 3.1 설정 파일 (`config/index.ts`)

```typescript
import dotenv from 'dotenv'
import { CrawlOptions } from '../../../common/types'

dotenv.config()

export const config = {
  newSite: {
    baseUrl: process.env.NEW_SITE_BASE_URL || 'https://example.com',
    // 쿠키 등 인증 정보 (필요시)
  },
  database: {
    // DB 설정 (공통)
  },
  crawl: {
    delayMs: parseInt(process.env.CRAWL_DELAY_MS || '1000', 10),
  },
  puppeteer: {
    headless: process.env.HEADLESS !== 'false',
  },
}

export function parseCrawlOptions(): CrawlOptions {
  const options: CrawlOptions = {}
  const args = process.argv.slice(2)

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg.startsWith('--include=')) {
      options.includeCategories = arg.split('=')[1].split(',').map((s) => s.trim())
    }

    if (arg.startsWith('--exclude=')) {
      options.excludeCategories = arg.split('=')[1].split(',').map((s) => s.trim())
    }

    if (arg === '--target-only') {
      options.targetOnly = true
    }
  }

  return options
}
```

#### 3.2 카테고리 크롤러 (`category-crawler.ts`)

```typescript
import { Page } from 'puppeteer'
import { Category } from '../../common/types'
import { logger } from '../../utils/logger'

export class CategoryCrawler {
  async crawlCategories(page: Page): Promise<Category[]> {
    const categories: Category[] = []

    try {
      // 카테고리 페이지로 이동
      await page.goto('https://example.com/categories', {
        waitUntil: 'networkidle0',
      })

      // 카테고리 추출 로직
      const categoryElements = await page.$$('.category-item')

      for (const element of categoryElements) {
        const id = await element.$eval('.category-id', (el) => el.textContent?.trim() || '')
        const name = await element.$eval('.category-name', (el) => el.textContent?.trim() || '')
        const url = await element.$eval('a', (el) => (el as HTMLAnchorElement).href)

        categories.push({
          id,
          name,
          url,
          level: 1, // 카테고리 레벨
        })
      }

      logger.success(`카테고리 ${categories.length}개 수집 완료`)
    } catch (error) {
      logger.error('카테고리 수집 실패', error)
      throw error
    }

    return categories
  }
}
```

#### 3.3 제품 크롤러 (`product-crawler.ts`)

```typescript
import { Page } from 'puppeteer'
import { ProductBasic } from '../../common/types'
import { logger } from '../../utils/logger'

export class ProductCrawler {
  async crawlProductList(page: Page, categoryUrl: string, categoryId: string): Promise<ProductBasic[]> {
    const products: ProductBasic[] = []

    try {
      await page.goto(categoryUrl, { waitUntil: 'networkidle0' })

      const productElements = await page.$$('.product-item')

      for (const element of productElements) {
        const goodsNo = await element.$eval('.product-id', (el) => el.textContent?.trim() || '')
        const name = await element.$eval('.product-name', (el) => el.textContent?.trim() || '')
        const priceText = await element.$eval('.product-price', (el) => el.textContent?.trim() || '0')
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10)
        const thumbnailUrl = await element.$eval('img', (el) => (el as HTMLImageElement).src)
        const detailPageUrl = await element.$eval('a', (el) => (el as HTMLAnchorElement).href)

        products.push({
          goodsNo,
          name,
          price,
          thumbnailUrl,
          detailPageUrl,
          categoryId,
        })
      }

      logger.info(`제품 ${products.length}개 수집`)
    } catch (error) {
      logger.error('제품 수집 실패', error)
      throw error
    }

    return products
  }
}
```

#### 3.4 메인 크롤러 (`index.ts`)

```typescript
import 'dotenv/config'
import { config } from './config'
import { BrowserManager } from '../../common/browser'
import { CategoryCrawler } from './category-crawler'
import { ProductCrawler } from './product-crawler'
import { DatabaseSaverV2 } from '../../common/save-to-db-v2'
import { delay } from '../../utils/delay'
import { logger } from '../../utils/logger'
import { CrawlOptions, Category } from '../../common/types'
import { getTargetCategories, getTargetCategoryInfo } from '../../config/target-categories'

export class NewSiteCrawler {
  private browserManager: BrowserManager
  private categoryCrawler: CategoryCrawler
  private productCrawler: ProductCrawler
  private dbSaver: DatabaseSaverV2

  constructor() {
    this.browserManager = new BrowserManager(config.puppeteer.headless, [])
    this.categoryCrawler = new CategoryCrawler()
    this.productCrawler = new ProductCrawler()
    this.dbSaver = new DatabaseSaverV2()
  }

  async initialize(): Promise<void> {
    await this.dbSaver.initialize()
    logger.success('DB 연결 완료')
  }

  async close(): Promise<void> {
    await this.dbSaver.close()
    await this.browserManager.close()
  }

  private filterCategories(categories: Category[], options: CrawlOptions): Category[] {
    let filtered = categories

    if (options.targetOnly) {
      const targetCodes = new Set(getTargetCategories('newsite'))
      filtered = filtered.filter((c) => targetCodes.has(c.id))
      return filtered
    }

    // includeCategories, excludeCategories 로직
    // ...

    return filtered
  }

  async crawlAll(options: CrawlOptions = {}): Promise<void> {
    const startTime = new Date()

    try {
      logger.info('=== NewSite 크롤링 시작 ===')

      await this.initialize()
      const page = await this.browserManager.newPage()

      // 1단계: 카테고리
      const allCategories = await this.categoryCrawler.crawlCategories(page)
      const filteredCategories = this.filterCategories(allCategories, options)
      await this.dbSaver.saveCategories(filteredCategories, 'newsite')

      // 2단계: 제품
      for (const category of filteredCategories) {
        const products = await this.productCrawler.crawlProductList(page, category.url, category.id)
        await this.dbSaver.saveProducts(products, 'newsite')
        await delay(config.crawl.delayMs)
      }

      logger.success('크롤링 완료')
    } catch (error) {
      logger.error('크롤링 실패', error)
      throw error
    } finally {
      await this.close()
    }
  }
}
```

### 4단계: 타겟 카테고리 설정

`config/target-categories.ts`에 새 사이트 추가:

```typescript
export const NEWSITE_TARGET_CATEGORIES: Record<string, string> = {
  'CAT001': '양변기',
  'CAT002': '세면대',
  // ...
}

export const TARGET_CATEGORIES = {
  dasis: DASIS_TARGET_CATEGORIES,
  wooribath: WOORIBATH_TARGET_CATEGORIES,
  newsite: NEWSITE_TARGET_CATEGORIES, // 추가
} as const
```

### 5단계: 메인 인덱스에 등록

`scripts/crawler/index.ts`에 새 사이트 추가:

```typescript
import { NewSiteCrawler } from './sites/newsite'

async function main() {
  const site = parseSite()
  const options = parseCrawlOptions()

  switch (site) {
    case 'dasis':
      // ...
      break
    case 'wooribath':
      // ...
      break
    case 'newsite': {
      const crawler = new NewSiteCrawler()
      await crawler.crawlAll(options)
      break
    }
    default:
      logger.error(`지원하지 않는 사이트: ${site}`)
      logger.info('사용 가능한 사이트: dasis, wooribath, newsite')
      process.exit(1)
  }
}
```

### 6단계: 테스트

```bash
# 카테고리만 테스트
npm run crawler -- --site=newsite --include=CAT001

# 전체 크롤링 테스트
npm run crawler -- --site=newsite --target-only
```

---

## 문제 해결

### 1. 세션 만료 (다시스)

**증상**: "세션이 만료되었습니다" 에러

**해결**:
1. 브라우저에서 https://www.dasis.co.kr 접속
2. 로그인
3. 개발자 도구 → Application → Cookies
4. `GD5SESSID` 값 복사
5. `.env` 파일의 `DASIS_COOKIE_GD5SESSID` 값 업데이트

```bash
# .env
DASIS_COOKIE_GD5SESSID=your-new-cookie-value
```

### 2. 데이터베이스 연결 실패

**증상**: "DB 연결 실패" 에러

**해결**:
```bash
# PostgreSQL 상태 확인
npm run docker:dev:status

# 컨테이너 재시작
npm run docker:dev:down
npm run docker:dev:up

# 연결 테스트
npm run test:db-connection
```

### 3. 크롤링 속도 너무 느림

**해결**:
```bash
# 딜레이 시간 조정 (.env)
CRAWL_DELAY_MS=500  # 기본값: 1000ms

# 동시 실행 페이지 수 증가
MAX_CONCURRENT_PAGES=5  # 기본값: 3
```

### 4. 특정 카테고리 크롤링 실패

**증상**: 특정 카테고리만 제품이 수집되지 않음

**해결**:
```bash
# headless 모드 끄고 직접 확인
HEADLESS=false npm run crawler -- --site=dasis --include=002003

# 브라우저가 열리면 직접 페이지 확인 가능
```

### 5. 중복 데이터

**증상**: 같은 제품이 여러 번 저장됨

**해결**:
- 크롤러는 `goodsNo`를 기준으로 upsert 수행
- DB에서 수동으로 중복 제거:

```sql
-- 중복 확인
SELECT goods_no, COUNT(*)
FROM zc.product_listings
GROUP BY goods_no
HAVING COUNT(*) > 1;

-- 중복 제거 (최신 것만 남기기)
DELETE FROM zc.product_listings
WHERE id NOT IN (
  SELECT MAX(id)
  FROM zc.product_listings
  GROUP BY goods_no
);
```

---

## 개발 참고

### 디렉토리 구조

```
crawler/
├── config/
│   └── target-categories.ts    # 타겟 카테고리 설정
├── common/
│   ├── browser.ts               # 브라우저 관리
│   ├── save-to-db-v2.ts        # DB 저장 로직
│   └── types/                   # 공통 타입 정의
├── sites/
│   ├── dasis/                   # 다시스 크롤러
│   │   ├── config/
│   │   ├── category-crawler.ts
│   │   ├── product-list-crawler.ts
│   │   └── index.ts
│   └── wooribath/               # 우리욕실 크롤러
│       ├── config/
│       ├── category-crawler.ts
│       ├── product-crawler.ts
│       └── index.ts
├── utils/
│   ├── delay.ts                 # 딜레이 유틸
│   ├── logger.ts                # 로거
│   └── image-downloader.ts      # 이미지 다운로드 (미사용)
├── index.ts                     # 메인 진입점
└── README.md                    # 이 문서
```

### 주요 컴포넌트

- **BrowserManager**: Puppeteer 브라우저 관리
- **CategoryCrawler**: 카테고리 수집
- **ProductCrawler**: 제품 수집
- **DatabaseSaverV2**: DB 저장 (upsert)

### 환경 변수

```bash
# .env 파일

# 다시스
DASIS_BASE_URL=https://www.dasis.co.kr
DASIS_COOKIE_GD5SESSID=your-cookie-value

# 우리욕실
WOORIBATH_BASE_URL=https://www.wooribath.co.kr

# 크롤링 설정
CRAWL_DELAY_MS=1000
MAX_CONCURRENT_PAGES=3
HEADLESS=true

# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password123
DB_DATABASE=living_craft_dev
DB_SCHEMA=zc
```

---

## 라이선스

이 크롤러는 Living Craft 프로젝트의 일부입니다.
