import * as cheerio from 'cheerio'
import { Page } from 'puppeteer'
import { config } from '../config'
import { ProductBasic } from '../types'
import { delay, randomDelay } from '../utils/delay'
import { logger } from '../utils/logger'

/**
 * 제품 목록 크롤러
 */
export class ProductListCrawler {
  /**
   * 카테고리 페이지에서 제품 목록 수집 (모든 페이지)
   */
  async crawlProductList(page: Page, categoryUrl: string, categoryId: string): Promise<ProductBasic[]> {
    logger.info(`제품 목록 크롤링: ${categoryUrl}`)

    const allProducts: ProductBasic[] = []

    try {
      // 첫 페이지 로드
      await page.goto(categoryUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      await delay(1000)

      // 페이지네이션 확인
      const totalPages = await this.getTotalPages(page)
      logger.info(`총 ${totalPages}페이지 발견`)

      // 각 페이지 순회
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        logger.info(`페이지 ${pageNum}/${totalPages} 크롤링 중...`)

        // 첫 페이지가 아니면 해당 페이지로 이동
        if (pageNum > 1) {
          const pageUrl = this.buildPageUrl(categoryUrl, pageNum)
          await page.goto(pageUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          })
          await delay(1000)
        }

        const products = await this.extractProductsFromPage(page, categoryId)
        allProducts.push(...products)

        logger.success(`페이지 ${pageNum}: ${products.length}개 제품 수집`)
      }

      logger.success(`전체 ${allProducts.length}개 제품 수집 완료`)

      return allProducts
    } catch (error) {
      logger.error(`제품 목록 크롤링 실패: ${categoryUrl}`, error)
      return allProducts // 지금까지 수집한 제품이라도 반환
    }
  }

  /**
   * 세션 유효성 확인
   */
  private async checkSession(page: Page): Promise<void> {
    try {
      const currentUrl = page.url()
      if (currentUrl.includes('login') || currentUrl.includes('member')) {
        throw new Error('세션이 만료되었습니다. 로그인이 필요합니다. GD5SESSID 쿠키를 갱신하세요.')
      }

      const priceElements = await page.$$('.item_price, .price')
      if (priceElements.length === 0) {
        logger.warn('가격 정보를 찾을 수 없습니다. 세션이 만료되었을 수 있습니다.')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('세션이 만료')) {
        throw error
      }
      logger.warn('세션 확인 중 오류', error)
    }
  }

  /**
   * 현재 페이지에서 제품 정보 추출
   */
  private async extractProductsFromPage(page: Page, categoryId: string): Promise<ProductBasic[]> {
    // 세션 확인
    await this.checkSession(page)

    const html = await page.content()
    const $ = cheerio.load(html)

    const products: ProductBasic[] = []

    // Dasis 사이트의 제품 리스트 구조에 맞는 선택자
    $('.item_basket_type li .item_cont').each((index, element) => {
      const $el = $(element)

      try {
        // 제품 링크에서 goodsNo 추출
        const detailLink = $el.find('a[href*="goodsNo="]').first().attr('href') || ''
        const goodsNoMatch = detailLink.match(/goodsNo=(\d+)/)
        const goodsNo = goodsNoMatch ? goodsNoMatch[1] : ''

        if (!goodsNo) {
          logger.warn(`제품 번호를 찾을 수 없습니다: ${index}`)
          return
        }

        // 제품명
        const name = $el.find('.item_name').text().trim()
        if (!name) {
          logger.warn(`제품명을 찾을 수 없습니다: goodsNo=${goodsNo}`)
          return
        }

        // 브랜드명
        const brandName = $el.find('.item_brand strong').text().trim() || undefined

        // 모델명은 별도로 없는 것 같아서 제품명에서 추출하거나 상세 페이지에서 가져와야 함
        const modelName = undefined

        // 가격 파싱
        const priceElement = $el.find('.item_price')
        let price = 0
        let discountPrice: number | undefined = undefined

        // <del> 태그가 있으면 원가, 그 다음이 할인가
        const delPrice = priceElement
          .find('del')
          .text()
          .replace(/[^0-9]/g, '')
        const currentPriceText = priceElement.text().replace(/[^0-9]/g, '')

        if (delPrice) {
          price = parseInt(delPrice, 10) || 0
          discountPrice = parseInt(currentPriceText.replace(delPrice, ''), 10) || 0
        } else {
          price = parseInt(currentPriceText, 10) || 0
        }

        // 가격이 없으면 세션 만료로 간주하고 크롤링 중단
        if (price === 0) {
          logger.error('가격 정보를 찾을 수 없습니다. 세션이 만료되었습니다.')
          throw new Error('세션이 만료되었습니다. 로그인이 필요합니다. GD5SESSID 쿠키를 갱신하세요.')
        }

        // 썸네일 이미지
        let thumbnailUrl = $el.find('.item_photo_box img').attr('src') || ''
        if (!thumbnailUrl.startsWith('http') && thumbnailUrl) {
          thumbnailUrl = `${config.dasis.baseUrl}${thumbnailUrl}`
        }

        // 상세 페이지 URL
        let detailPageUrl = detailLink
        if (!detailPageUrl.startsWith('http') && detailPageUrl) {
          // ../goods/goods_view.php?goodsNo=XXX 형태를 절대 경로로 변환
          detailPageUrl = detailPageUrl.replace('..', '')
          detailPageUrl = `${config.dasis.baseUrl}${detailPageUrl}`
        }

        products.push({
          goodsNo,
          name,
          brandName,
          modelName,
          price,
          discountPrice,
          thumbnailUrl,
          detailPageUrl,
          categoryId,
        })
      } catch (error) {
        logger.warn(`제품 파싱 실패 (인덱스: ${index})`, error)
      }
    })

    return products
  }

  /**
   * 페이지네이션에서 총 페이지 수 확인
   */
  private async getTotalPages(page: Page): Promise<number> {
    try {
      const paginationLinks = await page.$$('.pagination a')

      if (paginationLinks.length === 0) {
        return 1 // 페이지네이션 없으면 1페이지만 있음
      }

      // 페이지 번호 추출
      const pageNumbers: number[] = []

      for (const link of paginationLinks) {
        const href = await page.evaluate((el) => el.getAttribute('href'), link)
        if (href) {
          const match = href.match(/page=(\d+)/)
          if (match) {
            pageNumbers.push(parseInt(match[1], 10))
          }
        }
      }

      // 가장 큰 페이지 번호 반환
      return pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1
    } catch (error) {
      logger.warn('페이지네이션 확인 실패, 1페이지로 처리', error)
      return 1
    }
  }

  /**
   * 페이지 번호로 URL 생성
   */
  private buildPageUrl(baseUrl: string, pageNum: number): string {
    const url = new URL(baseUrl)
    url.searchParams.set('page', pageNum.toString())
    return url.toString()
  }
}
