import 'dotenv/config'
import { BrowserManager } from './crawlers/browser'
import { ProductDetailCrawler } from './crawlers/product-detail-crawler'
import { ProductListCrawler } from './crawlers/product-list-crawler'
import DatabaseSaverV2 from './save-to-db-v2'
import { delay } from './utils/delay'
import { logger } from './utils/logger'

/**
 * 특정 카테고리만 크롤링하는 테스트 스크립트
 */
async function testCrawlCategory() {
  const browserManager = new BrowserManager()
  const productListCrawler = new ProductListCrawler()
  const productDetailCrawler = new ProductDetailCrawler()
  const dbSaver = new DatabaseSaverV2()

  try {
    logger.info('=== 수전 카테고리 테스트 크롤링 시작 ===')

    // DB 초기화
    await dbSaver.initialize()

    const page = await browserManager.newPage()

    // 수전 카테고리 URL (카테고리 코드: 004)
    const categoryUrl = 'https://www.dasis.co.kr/goods/goods_list.php?cateCd=004'
    const categoryId = '004'
    const categoryName = '수전'

    logger.info(`카테고리: ${categoryName}`)
    logger.info(`URL: ${categoryUrl}`)

    // 1단계: 제품 목록 수집
    logger.info('\n[1/2] 제품 목록 수집 중...')
    const products = await productListCrawler.crawlProductList(page, categoryUrl, categoryId)

    if (products.length === 0) {
      logger.warn('제품이 수집되지 않았습니다. 세션을 확인하세요.')
      return
    }

    logger.success(`${products.length}개 제품 목록 수집 완료`)

    // 2단계: 제품 상세 정보 수집
    logger.info('\n[2/2] 제품 상세 정보 수집 중...')

    const detailedProducts = []

    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      logger.info(`[${i + 1}/${products.length}] ${product.name}`)

      const detailProduct = await productDetailCrawler.crawlProductDetail(page, product.detailPageUrl, product)

      detailedProducts.push(detailProduct)

      // 제품 간 대기
      await delay(1000)
    }

    logger.success(`\n${detailedProducts.length}개 제품 상세 정보 수집 완료`)

    // 3단계: DB 저장
    logger.info('\n[3/3] DB에 저장 중...')

    // 카테고리 먼저 저장
    await dbSaver.saveCategories([
      {
        id: categoryId,
        name: categoryName,
        url: categoryUrl,
        level: 1,
        parentId: null,
      },
    ])

    // 제품 저장
    await dbSaver.saveProducts(detailedProducts)

    // 통계 출력
    await dbSaver.getStats()

    logger.success('\n✅ 테스트 크롤링 완료!')
  } catch (error) {
    logger.error('크롤링 중 오류 발생', error)

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
    await browserManager.close()
    await dbSaver.close()
  }
}

// 실행
testCrawlCategory()
  .then(() => {
    logger.success('스크립트 종료')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('치명적 오류', error)
    process.exit(1)
  })
