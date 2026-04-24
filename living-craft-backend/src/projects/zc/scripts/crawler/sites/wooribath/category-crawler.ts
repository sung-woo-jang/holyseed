import * as cheerio from 'cheerio'
import { Page } from 'puppeteer'
import { config } from './config'
import { Category } from '../../common/types'
import { delay } from '../../utils/delay'
import { logger } from '../../utils/logger'

/**
 * Wooribath 카테고리 크롤러
 */
export class CategoryCrawler {
  /**
   * 전체 카테고리 목록 수집
   */
  async crawlCategories(page: Page): Promise<Category[]> {
    logger.info('Wooribath 카테고리 크롤링 시작')

    try {
      await page.goto(`${config.wooribath.baseUrl}/`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      await delay(2000)

      const html = await page.content()
      const $ = cheerio.load(html)

      const categories: Category[] = []
      const seenUrls = new Set<string>()

      // 메인 네비게이션에서 카테고리 링크 수집
      // 선택자: .category a[href*="/category/"]
      $('.category a[href*="/category/"]').each((index, element) => {
        const $el = $(element)
        const name = $el.text().trim()
        let url = $el.attr('href') || ''

        if (!name || !url) return

        // 이벤트/브랜드 제외
        if (name.includes('이벤트') || name.includes('브랜드')) return

        // 절대 경로로 변환
        if (!url.startsWith('http')) {
          url = url.startsWith('/') ? `${config.wooribath.baseUrl}${url}` : `${config.wooribath.baseUrl}/${url}`
        }

        if (seenUrls.has(url)) return
        seenUrls.add(url)

        // URL에서 카테고리 ID 추출: /category/양변기비데/328/
        const match = url.match(/\/category\/[^/]+\/(\d+)/)
        if (!match) return

        const categoryId = match[1]

        categories.push({
          id: categoryId,
          name,
          url,
          level: 1, // Wooribath는 단일 레벨 카테고리
        })
      })

      // 카테고리 ID로 정렬
      categories.sort((a, b) => a.id.localeCompare(b.id))

      logger.success(`총 ${categories.length}개 카테고리 수집 완료`)
      categories.forEach(cat => {
        logger.info(`  - ${cat.name} (${cat.id})`)
      })

      return categories
    } catch (error) {
      logger.error('카테고리 크롤링 실패', error)
      throw error
    }
  }
}
