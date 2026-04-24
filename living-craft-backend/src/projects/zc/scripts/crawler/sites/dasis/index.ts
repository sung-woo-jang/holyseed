import 'dotenv/config'
import { config } from './config'
import { BrowserManager, CookieOptions } from '../../common/browser'
import { CategoryCrawler } from './category-crawler'
import { ProductDetailCrawler } from './product-detail-crawler'
import { ProductListCrawler } from './product-list-crawler'
import { DatabaseSaverV2 } from '../../common/save-to-db-v2'
import { delay } from '../../utils/delay'
import { logger } from '../../utils/logger'
import { CrawlOptions, Category } from '../../common/types'
import { getTargetCategories, getTargetCategoryInfo } from '../../config/target-categories'

/**
 * Dasis 사이트 크롤러
 */
export class DasisCrawler {
  private browserManager: BrowserManager
  private categoryCrawler: CategoryCrawler
  private productListCrawler: ProductListCrawler
  private productDetailCrawler: ProductDetailCrawler
  private dbSaver: DatabaseSaverV2

  constructor() {
    // Dasis 쿠키 설정
    const cookies: CookieOptions[] = []
    if (config.dasis.cookieGD5SESSID) {
      cookies.push({
        name: 'GD5SESSID',
        value: config.dasis.cookieGD5SESSID,
        domain: '.dasis.co.kr',
        path: '/',
        httpOnly: false,
        secure: false,
      })
    }

    this.browserManager = new BrowserManager(config.puppeteer.headless, cookies)
    this.categoryCrawler = new CategoryCrawler()
    this.productListCrawler = new ProductListCrawler()
    this.productDetailCrawler = new ProductDetailCrawler()
    this.dbSaver = new DatabaseSaverV2()
  }

  /**
   * DB 초기화
   */
  async initialize(): Promise<void> {
    await this.dbSaver.initialize()
    logger.success('DB 연결 완료')
  }

  /**
   * 리소스 정리
   */
  async close(): Promise<void> {
    await this.dbSaver.close()
    await this.browserManager.close()
  }

  /**
   * DB 저장용 카테고리 필터링 (대분류 + 중분류 모두 포함)
   */
  private filterCategoriesForSave(categories: Category[], options: CrawlOptions): Category[] {
    let filtered = categories

    // targetOnly 옵션: 타겟 카테고리만 필터링
    if (options.targetOnly) {
      const targetCodes = new Set(getTargetCategories('dasis'))
      filtered = filtered.filter((c) => {
        return targetCodes.has(c.id) || (c.parentId && targetCodes.has(c.parentId))
      })
      return filtered
    }

    // 기본 필터링
    if (!options.includeCategories && !options.excludeCategories) {
      return categories
    }

    if (options.includeCategories && options.includeCategories.length > 0) {
      const includeCodes = new Set(options.includeCategories)
      filtered = filtered.filter((c) => {
        return includeCodes.has(c.id) || (c.parentId && includeCodes.has(c.parentId))
      })
    }

    if (options.excludeCategories && options.excludeCategories.length > 0) {
      const excludeCodes = new Set(options.excludeCategories)
      filtered = filtered.filter((c) => {
        return !excludeCodes.has(c.id) && (!c.parentId || !excludeCodes.has(c.parentId))
      })
    }

    return filtered
  }

  /**
   * 제품 크롤링용 카테고리 필터링 (level 2만)
   */
  private filterCategories(categories: Category[], options: CrawlOptions): Category[] {
    let filtered = categories

    // targetOnly 옵션: 타겟 카테고리만 필터링
    if (options.targetOnly) {
      const targetCodes = new Set(getTargetCategories('dasis'))
      filtered = filtered.filter((c) => targetCodes.has(c.id))
      // level 2만 (중분류)
      filtered = filtered.filter((c) => c.level === 2)
      return filtered
    }

    // 기본 레벨 필터링
    if (options.categoryLevel !== undefined) {
      filtered = filtered.filter((c) => c.level === options.categoryLevel)
    } else {
      filtered = filtered.filter((c) => c.level === 2)
    }

    if (options.includeCategories && options.includeCategories.length > 0) {
      const includeCodes = new Set(options.includeCategories)
      filtered = filtered.filter((c) => {
        return includeCodes.has(c.id) || (c.parentId && includeCodes.has(c.parentId))
      })
    }

    if (options.excludeCategories && options.excludeCategories.length > 0) {
      const excludeCodes = new Set(options.excludeCategories)
      filtered = filtered.filter((c) => {
        return !excludeCodes.has(c.id) && (!c.parentId || !excludeCodes.has(c.parentId))
      })
    }

    return filtered
  }

  /**
   * 전체 크롤링 실행
   */
  async crawlAll(options: CrawlOptions = {}): Promise<void> {
    const startTime = new Date()

    try {
      logger.info('=== Dasis 크롤링 시작 ===')

      await this.initialize()

      const page = await this.browserManager.newPage()

      // 1단계: 카테고리 수집
      logger.info('\n[1/3] 카테고리 수집 및 저장 중...')
      const allCategories = await this.categoryCrawler.crawlCategories(page)
      const categoriesToSave = this.filterCategoriesForSave(allCategories, options)
      await this.dbSaver.saveCategories(categoriesToSave, 'dasis')
      logger.success(`카테고리 ${categoriesToSave.length}개 DB 저장 완료`)

      // 2단계: 제품 목록 수집
      logger.info('\n[2/3] 제품 목록 수집 및 저장 중...')

      const targetCategories = this.filterCategories(allCategories, options)

      if (targetCategories.length === 0) {
        logger.info('필터링된 카테고리가 없습니다.')
        return
      }

      logger.info(`필터링 결과: ${targetCategories.length}개 카테고리 크롤링 예정`)

      if (options.targetOnly) {
        logger.info('✅ [타겟 모드] ZC 사업 관련 카테고리만 크롤링')
        const targetInfo = getTargetCategoryInfo('dasis')
        logger.info('타겟 카테고리 목록:')
        targetInfo.forEach(({ code, name }) => {
          logger.info(`  - ${code}: ${name}`)
        })
      }

      if (options.includeCategories) {
        logger.info(`포함 카테고리: ${options.includeCategories.join(', ')}`)
      }
      if (options.excludeCategories) {
        logger.info(`제외 카테고리: ${options.excludeCategories.join(', ')}`)
      }

      for (let i = 0; i < targetCategories.length; i++) {
        const category = targetCategories[i]

        logger.info(`\n카테고리 [${i + 1}/${targetCategories.length}]: ${category.name} (${category.id})`)

        const products = await this.productListCrawler.crawlProductList(page, category.url, category.id)

        if (products.length > 0) {
          await this.dbSaver.saveProducts(products, 'dasis')
          logger.success(`${category.name}: ${products.length}개 제품 DB 저장`)
        } else {
          logger.info(`${category.name}: 제품 없음`)
        }

        await delay(config.crawl.delayMs)
      }

      // 3단계: 상세 페이지 크롤링 생략
      logger.info('\n[3/3] 상세 페이지 크롤링 생략 (목록 페이지에서 모든 정보 수집 완료)')

      const endTime = new Date()

      logger.success('\n=== 크롤링 완료 ===')
      logger.info(`소요 시간: ${this.getElapsedTime(startTime, endTime)}`)

      await this.dbSaver.getStats()
    } catch (error) {
      logger.error('크롤링 중 치명적 오류 발생', error)

      if (error instanceof Error && error.message.includes('세션이 만료')) {
        logger.error('========================================')
        logger.error('세션이 만료되었습니다!')
        logger.error('다음 단계를 따라 쿠키를 갱신하세요:')
        logger.error('1. 브라우저에서 https://www.dasis.co.kr 접속')
        logger.error('2. 로그인')
        logger.error('3. 개발자 도구 > Application > Cookies')
        logger.error('4. GD5SESSID 값 복사')
        logger.error('5. .env 파일의 DASIS_COOKIE_GD5SESSID 값 업데이트')
        logger.error('========================================')
      }

      throw error
    } finally {
      await this.close()
    }
  }

  /**
   * 소요 시간 계산
   */
  private getElapsedTime(start: Date, end: Date): string {
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours}시간 ${minutes}분 ${seconds}초`
  }
}
