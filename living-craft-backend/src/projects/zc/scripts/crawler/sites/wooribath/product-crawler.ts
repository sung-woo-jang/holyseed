import * as cheerio from 'cheerio'
import { Page } from 'puppeteer'
import { config } from './config'
import { ProductBasic } from '../../common/types'
import { delay } from '../../utils/delay'
import { logger } from '../../utils/logger'
import { extractModelName } from '../../utils/model-name-extractor'

/**
 * Wooribath 제품 크롤러
 */
export class ProductCrawler {
  /**
   * 카테고리 페이지에서 제품 목록 수집
   */
  async crawlProductList(page: Page, categoryUrl: string, categoryId: string): Promise<ProductBasic[]> {
    logger.info(`제품 목록 크롤링: ${categoryUrl}`)

    try {
      await page.goto(categoryUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      })

      await delay(2000)

      // "상품 더보기" 버튼 반복 클릭하여 모든 제품 로드
      await this.loadAllProducts(page)

      const html = await page.content()
      const $ = cheerio.load(html)

      const products: ProductBasic[] = []

      // cafe24 제품 리스트: .prdList li
      $('.prdList li').each((index, element) => {
        const $el = $(element)

        try {
          // 제품명
          const name = $el.find('.name').text().trim()
          if (!name) return

          // 제품명에서 "상품명 : " 제거
          const cleanName = name.replace(/^상품명\s*:\s*/, '').trim()

          // 제품 링크
          const detailLink = $el.find('a[href*="/product/"]').first().attr('href') || ''
          if (!detailLink) return

          // 제품 ID 추출: /product/{이름}/{ID}/category/{카테고리ID}/display/1/
          const idMatch = detailLink.match(/\/product\/[^/]+\/(\d+)\//)
          if (!idMatch) return

          const goodsNo = idMatch[1]

          // data-price 속성에서 직접 가격 추출 (JS 렌더링 시 할인율 뱃지가 텍스트에 추가되어 regex 오파싱 방지)
          const dataPrice = $el.attr('data-price')
          let price = dataPrice ? parseInt(dataPrice, 10) : 0

          // data-price 없거나 0이면 텍스트 파싱 폴백 - "원" 앞의 숫자만 추출
          if (!price) {
            const priceText = $el.find('.product_price').text().trim()
            const priceMatch = priceText.match(/([\d,]+)원/)
            price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0
          }

          // 이미지
          let thumbnailUrl = $el.find('img').first().attr('src') || ''
          if (thumbnailUrl.startsWith('//')) {
            thumbnailUrl = 'https:' + thumbnailUrl
          } else if (!thumbnailUrl.startsWith('http') && thumbnailUrl) {
            thumbnailUrl = `${config.wooribath.baseUrl}${thumbnailUrl}`
          }

          // 상세 페이지 URL
          let detailPageUrl = detailLink
          if (!detailPageUrl.startsWith('http') && detailPageUrl) {
            detailPageUrl = detailPageUrl.startsWith('/')
              ? `${config.wooribath.baseUrl}${detailPageUrl}`
              : `${config.wooribath.baseUrl}/${detailPageUrl}`
          }

          // 브랜드명 추출 (제품명에서)
          const brandMatch = cleanName.match(/^([가-힣a-zA-Z\s]+)\s/)
          const brandName = brandMatch ? brandMatch[1].trim() : undefined

          // 모델명 추출
          const modelName = extractModelName(cleanName)

          products.push({
            goodsNo,
            name: cleanName,
            brandName,
            modelName,
            price,
            thumbnailUrl,
            detailPageUrl,
            categoryId,
          })
        } catch (error) {
          logger.warn(`제품 파싱 실패 (인덱스: ${index})`, error)
        }
      })

      logger.success(`${products.length}개 제품 수집 완료`)

      return products
    } catch (error) {
      logger.error(`제품 목록 크롤링 실패: ${categoryUrl}`, error)
      return []
    }
  }

  /**
   * "상품 더보기" 버튼 반복 클릭하여 모든 제품 로드
   */
  private async loadAllProducts(page: Page): Promise<void> {
    let clickCount = 0
    const maxClicks = 20 // 안전장치 (무한루프 방지)

    while (clickCount < maxClicks) {
      try {
        // "상품 더보기" 버튼 찾기
        const moreButton = await page.$('.btnMore--prd')

        if (!moreButton) {
          // 버튼 없으면 종료
          break
        }

        // 버튼이 보이는지 확인
        const isVisible = await moreButton.isVisible()
        if (!isVisible) {
          break
        }

        // 현재 제품 수 기록
        const beforeCount = await page.$$eval('.prdList li', (items) => items.length)

        // 버튼 클릭
        await moreButton.click()
        clickCount++

        // 새 제품 로드될 때까지 대기 (최대 5초)
        await page.waitForFunction(
          (prevCount) => {
            const currentCount = document.querySelectorAll('.prdList li').length
            return currentCount > prevCount
          },
          { timeout: 5000 },
          beforeCount
        ).catch(() => {
          // 타임아웃 시 로드 완료된 것으로 간주
        })

        await delay(1000)

        logger.info(`더보기 클릭 ${clickCount}회 (제품 ${beforeCount}개 → ${await page.$$eval('.prdList li', (items) => items.length)}개)`)
      } catch (error) {
        // 더 이상 로드할 제품 없음
        break
      }
    }

    if (clickCount > 0) {
      logger.success(`총 ${clickCount}회 더보기 클릭 완료`)
    }
  }
}
