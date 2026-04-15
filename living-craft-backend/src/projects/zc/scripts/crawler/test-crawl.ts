import * as path from 'path'
import 'dotenv/config'
import * as fs from 'fs/promises'
import { BrowserManager } from './crawlers/browser'
import { ProductDetailCrawler } from './crawlers/product-detail-crawler'
import { ProductListCrawler } from './crawlers/product-list-crawler'
import { delay } from './utils/delay'
import { logger } from './utils/logger'

/**
 * 테스트용 크롤링 (1-2개 카테고리만)
 */
async function testCrawl() {
  const browserManager = new BrowserManager()
  const productListCrawler = new ProductListCrawler()
  const productDetailCrawler = new ProductDetailCrawler()

  try {
    logger.info('=== 테스트 크롤링 시작 ===')
    logger.info('카테고리: 양변기 (002)\n')

    const page = await browserManager.newPage()

    // 양변기 카테고리 크롤링
    const categoryUrl = 'https://www.dasis.co.kr/shop/shopbrand.html?xcode=002'
    const categoryId = '002'

    logger.info('[1/2] 제품 목록 수집 중...')
    const products = await productListCrawler.crawlProductList(page, categoryUrl, categoryId)

    logger.success(`${products.length}개 제품 목록 수집 완료`)

    // 제품 수를 최대 10개로 제한 (테스트용)
    const limitedProducts = products.slice(0, 10)
    logger.info(`\n테스트를 위해 ${limitedProducts.length}개 제품만 상세 크롤링합니다.`)

    logger.info('\n[2/2] 제품 상세 정보 수집 중...')

    const detailedProducts = []

    for (let i = 0; i < limitedProducts.length; i++) {
      const product = limitedProducts[i]

      try {
        logger.info(`[${i + 1}/${limitedProducts.length}] ${product.name} 크롤링 중...`)

        const detailPage = await browserManager.newPage()
        const detailedProduct = await productDetailCrawler.crawlProductDetail(
          detailPage,
          product.detailPageUrl,
          product
        )

        detailedProducts.push(detailedProduct)

        await detailPage.close()

        // 요청 간 대기
        if (i < limitedProducts.length - 1) {
          await delay(1000)
        }
      } catch (error) {
        logger.warn(`제품 상세 크롤링 실패: ${product.name}`, error)
      }
    }

    logger.success(`\n${detailedProducts.length}개 제품 상세 정보 수집 완료`)

    // 결과 저장
    const dataDir = path.join(process.cwd(), 'downloads', 'data')
    await fs.mkdir(dataDir, { recursive: true })

    const productsPath = path.join(dataDir, 'products.json')
    await fs.writeFile(productsPath, JSON.stringify(detailedProducts, null, 2), 'utf-8')

    logger.success(`\n결과 저장 완료: ${productsPath}`)
    logger.info(`\n다음 단계: npm run crawler:save-db-v2`)

    await page.close()
    await browserManager.close()

    logger.success('\n✅ 테스트 크롤링 완료!')
  } catch (error) {
    logger.error('크롤링 실패:', error)
    throw error
  } finally {
    await browserManager.close()
  }
}

if (require.main === module) {
  testCrawl().catch((error) => {
    logger.error('치명적 오류:', error)
    process.exit(1)
  })
}

export default testCrawl
