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

/**
 * Wooribath 사이트 크롤러
 */
export class WooribathCrawler {
  private browserManager: BrowserManager
  private categoryCrawler: CategoryCrawler
  private productCrawler: ProductCrawler
  private dbSaver: DatabaseSaverV2

  constructor() {
    // Wooribath는 로그인 불필요 (쿠키 없음)
    this.browserManager = new BrowserManager(config.puppeteer.headless, [])
    this.categoryCrawler = new CategoryCrawler()
    this.productCrawler = new ProductCrawler()
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
   * 카테고리 필터링
   */
  private filterCategories(categories: Category[], options: CrawlOptions): Category[] {
    let filtered = categories

    // targetOnly 옵션: 타겟 카테고리만 필터링
    if (options.targetOnly) {
      const targetCodes = new Set(getTargetCategories('wooribath'))
      filtered = filtered.filter((c) => targetCodes.has(c.id))
      return filtered
    }

    // 포함 카테고리 필터링
    if (options.includeCategories && options.includeCategories.length > 0) {
      const includeCodes = new Set(options.includeCategories)
      filtered = filtered.filter((c) => {
        // ID 또는 이름으로 필터링
        return includeCodes.has(c.id) || includeCodes.has(c.name)
      })
    }

    // 제외 카테고리 필터링
    if (options.excludeCategories && options.excludeCategories.length > 0) {
      const excludeCodes = new Set(options.excludeCategories)
      filtered = filtered.filter((c) => {
        return !excludeCodes.has(c.id) && !excludeCodes.has(c.name)
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
      logger.info('=== Wooribath 크롤링 시작 ===')

      await this.initialize()

      const page = await this.browserManager.newPage()

      // 1단계: 카테고리 수집
      logger.info('\n[1/2] 카테고리 수집 및 저장 중...')
      const allCategories = await this.categoryCrawler.crawlCategories(page)
      const filteredCategories = this.filterCategories(allCategories, options)

      // DB에 카테고리 저장 (Site code = 'wooribath')
      await this.dbSaver.saveCategories(filteredCategories, 'wooribath')
      logger.success(`카테고리 ${filteredCategories.length}개 DB 저장 완료`)

      // 2단계: 제품 목록 수집
      logger.info('\n[2/2] 제품 목록 수집 및 저장 중...')

      if (filteredCategories.length === 0) {
        logger.info('필터링된 카테고리가 없습니다.')
        return
      }

      logger.info(`필터링 결과: ${filteredCategories.length}개 카테고리 크롤링 예정`)

      if (options.targetOnly) {
        logger.info('✅ [타겟 모드] ZC 사업 관련 카테고리만 크롤링')
        const targetInfo = getTargetCategoryInfo('wooribath')
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

      for (let i = 0; i < filteredCategories.length; i++) {
        const category = filteredCategories[i]

        logger.info(`\n카테고리 [${i + 1}/${filteredCategories.length}]: ${category.name} (${category.id})`)

        const products = await this.productCrawler.crawlProductList(page, category.url, category.id)

        if (products.length > 0) {
          await this.dbSaver.saveProducts(products, 'wooribath')
          logger.success(`${category.name}: ${products.length}개 제품 DB 저장`)
        } else {
          logger.info(`${category.name}: 제품 없음`)
        }

        await delay(config.crawl.delayMs)
      }

      const endTime = new Date()

      logger.success('\n=== 크롤링 완료 ===')
      logger.info(`소요 시간: ${this.getElapsedTime(startTime, endTime)}`)

      await this.dbSaver.getStats()
    } catch (error) {
      logger.error('크롤링 중 치명적 오류 발생', error)
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
