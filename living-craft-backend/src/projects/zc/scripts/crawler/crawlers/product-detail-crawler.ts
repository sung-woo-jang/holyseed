import * as cheerio from 'cheerio'
import { Page } from 'puppeteer'
import { config } from '../config'
import { ProductDetail } from '../types'
import { delay } from '../utils/delay'
import { logger } from '../utils/logger'

/**
 * 제품 상세 페이지 크롤러
 */
export class ProductDetailCrawler {
  /**
   * 세션 유효성 확인
   */
  private async checkSession(page: Page): Promise<void> {
    try {
      const currentUrl = page.url()
      if (currentUrl.includes('login') || currentUrl.includes('member')) {
        throw new Error('세션이 만료되었습니다. 로그인이 필요합니다. GD5SESSID 쿠키를 갱신하세요.')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('세션이 만료')) {
        throw error
      }
      logger.warn('세션 확인 중 오류', error)
    }
  }

  /**
   * 제품 상세 페이지 크롤링
   */
  async crawlProductDetail(page: Page, productUrl: string, basicProduct: any): Promise<ProductDetail> {
    logger.info(`제품 상세 크롤링: ${basicProduct.name}`)

    try {
      await page.goto(productUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      await delay(1000)

      // 세션 확인
      await this.checkSession(page)

      const html = await page.content()
      const $ = cheerio.load(html)

      // 기본 정보는 목록 페이지에서 가져온 것 사용
      const productDetail: ProductDetail = {
        ...basicProduct,
        description: '',
        detailedDescription: '',
        specifications: {},
        additionalImages: [],
      }

      // 제품 설명
      const description = $('.goods_info_sec, .item_detail_info, .goods_description').first().text().trim()
      if (description) {
        productDetail.description = description
      }

      // 상세 설명 (HTML 포함)
      const detailedDesc = $('.detail_cont, .goods_detail, #detail').html()
      if (detailedDesc) {
        productDetail.detailedDescription = detailedDesc
      }

      // 스펙 정보 추출 (테이블 형태)
      const specifications: Record<string, string> = {}
      $('.spec_table tr, .goods_spec tr, table.spec tr').each((_, row) => {
        const $row = $(row)
        const key = $row.find('th').text().trim()
        const value = $row.find('td').text().trim()

        if (key && value) {
          specifications[key] = value
        }
      })

      if (Object.keys(specifications).length > 0) {
        productDetail.specifications = specifications
      }

      // 제조사
      const manufacturer =
        $('*:contains("제조사")').next().text().trim() || $('*:contains("제조원")').next().text().trim()
      if (manufacturer) {
        productDetail.manufacturer = manufacturer
      }

      // 원산지
      const origin = $('*:contains("원산지")').next().text().trim() || $('*:contains("제조국")').next().text().trim()
      if (origin) {
        productDetail.origin = origin
      }

      // 추가 이미지 수집
      const imageUrls: string[] = []

      // 상품 상세 이미지들
      $('.detail_cont img, .goods_detail img, #detail img').each((_, img) => {
        let src = $(img).attr('src') || ''

        if (src && src.includes('goods') && !src.includes('icon')) {
          if (!src.startsWith('http')) {
            src = `${config.dasis.baseUrl}${src}`
          }

          // 중복 제거
          if (!imageUrls.includes(src) && src !== basicProduct.thumbnailUrl) {
            imageUrls.push(src)
          }
        }
      })

      // 썸네일 갤러리 이미지
      $('.thumb_list img, .goods_thumb img, .product_gallery img').each((_, img) => {
        let src = $(img).attr('src') || ''

        if (src) {
          if (!src.startsWith('http')) {
            src = `${config.dasis.baseUrl}${src}`
          }

          if (!imageUrls.includes(src) && src !== basicProduct.thumbnailUrl) {
            imageUrls.push(src)
          }
        }
      })

      productDetail.additionalImages = imageUrls

      logger.success(`제품 상세 정보 수집 완료: ${imageUrls.length}개 추가 이미지`)

      return productDetail
    } catch (error) {
      logger.error(`제품 상세 크롤링 실패: ${productUrl}`, error)

      // 실패해도 기본 정보는 반환
      return {
        ...basicProduct,
        additionalImages: [],
      }
    }
  }
}
