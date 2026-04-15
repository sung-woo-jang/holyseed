import 'dotenv/config'
import { config } from './config'
import { BrowserManager } from './crawlers/browser'
import { CategoryCrawler } from './crawlers/category-crawler'
import { ProductDetailCrawler } from './crawlers/product-detail-crawler'
import { ProductListCrawler } from './crawlers/product-list-crawler'
import { DatabaseSaverV2 } from './save-to-db-v2'
import { delay } from './utils/delay'
import { logger } from './utils/logger'

/**
 * 전체 크롤링 프로세스
 */
export class DasisCrawler {
  private browserManager: BrowserManager
  private categoryCrawler: CategoryCrawler
  private productListCrawler: ProductListCrawler
  private productDetailCrawler: ProductDetailCrawler
  private dbSaver: DatabaseSaverV2

  constructor() {
    this.browserManager = new BrowserManager()
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
   * 전체 크롤링 실행 (실시간 DB 저장)
   */
  async crawlAll(): Promise<void> {
    const startTime = new Date()

    try {
      logger.info('=== Dasis 크롤링 시작 ===')

      // DB 초기화
      await this.initialize()

      const page = await this.browserManager.newPage()

      // === 1단계: 카테고리 수집 + 즉시 DB 저장 ===
      logger.info('\n[1/3] 카테고리 수집 및 저장 중...')
      const categories = await this.categoryCrawler.crawlCategories(page)
      await this.dbSaver.saveCategories(categories)
      logger.success(`카테고리 ${categories.length}개 DB 저장 완료`)

      // === 2단계: 카테고리별 제품 목록 수집 + 즉시 저장 ===
      logger.info('\n[2/3] 제품 목록 수집 및 저장 중...')

      const level1Categories = categories.filter((c) => c.level === 1)

      for (let i = 0; i < level1Categories.length; i++) {
        const category = level1Categories[i]

        logger.info(`\n카테고리 [${i + 1}/${level1Categories.length}]: ${category.name}`)

        const products = await this.productListCrawler.crawlProductList(page, category.url, category.id)

        // 카테고리별 제품 즉시 DB 저장
        if (products.length > 0) {
          await this.dbSaver.saveProducts(products)
          logger.success(`${category.name}: ${products.length}개 제품 DB 저장`)
        } else {
          logger.info(`${category.name}: 제품 없음`)
        }

        // 카테고리 간 대기
        await delay(config.crawl.delayMs)
      }

      // === 3단계: 제품 상세 정보 수집 + 배치 저장 ===
      logger.info('\n[3/3] 제품 상세 정보 수집 및 저장 중...')

      const productsNeedingDetails = await this.getProductsNeedingDetails()
      logger.info(`상세 정보 수집 필요한 제품: ${productsNeedingDetails.length}개`)

      const detailBatch = []

      for (let i = 0; i < productsNeedingDetails.length; i++) {
        const product = productsNeedingDetails[i]

        logger.info(`[${i + 1}/${productsNeedingDetails.length}] ${product.productName}`)

        const detailProduct = await this.productDetailCrawler.crawlProductDetail(page, product.productUrl, {
          goodsNo: product.siteProductId,
          name: product.productName,
          categoryId: product.siteCategory?.siteCategoryCode || '',
          price: product.currentPrice,
          discountPrice: product.currentDiscountPrice,
          detailPageUrl: product.productUrl,
          thumbnailUrl: '', // 이미 저장됨
        })

        detailBatch.push(detailProduct)

        // 10개마다 배치 저장
        if (detailBatch.length >= 10) {
          await this.dbSaver.saveProducts(detailBatch)
          logger.success(`배치 저장 완료 (${i + 1}/${productsNeedingDetails.length})`)
          detailBatch.length = 0
        }

        // 제품 간 대기
        await delay(config.crawl.delayMs)
      }

      // 남은 제품 저장
      if (detailBatch.length > 0) {
        await this.dbSaver.saveProducts(detailBatch)
        logger.success('최종 배치 저장 완료')
      }

      const endTime = new Date()

      logger.success('\n=== 크롤링 완료 ===')
      logger.info(`소요 시간: ${this.getElapsedTime(startTime, endTime)}`)

      // DB 통계 출력
      await this.dbSaver.getStats()
    } catch (error) {
      logger.error('크롤링 중 치명적 오류 발생', error)

      // 세션 만료 에러인 경우 특별히 처리
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
   * 상세 정보가 필요한 제품 조회 (description이 null인 제품)
   */
  private async getProductsNeedingDetails(): Promise<any[]> {
    const ProductListing = (await import('../../modules/product-listings/entities/product-listing.entity'))
      .ProductListing

    const SiteCategory = (await import('../../modules/site-categories/entities/site-category.entity')).SiteCategory

    const productListingRepository = this.dbSaver['dataSource'].getRepository(ProductListing)

    return await productListingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.siteCategory', 'category')
      .where('listing.description IS NULL')
      .orderBy('listing.createdAt', 'ASC')
      .getMany()
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

/**
 * CLI에서 직접 실행 시
 */
if (require.main === module) {
  const crawler = new DasisCrawler()

  crawler
    .crawlAll()
    .then(() => {
      logger.success('크롤링이 성공적으로 완료되었습니다.')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('크롤링 실패', error)
      process.exit(1)
    })
}
