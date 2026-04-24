import * as cheerio from 'cheerio'
import { Page } from 'puppeteer'
import { config } from './config'
import { Category } from '../../common/types'
import { delay } from '../../utils/delay'
import { logger } from '../../utils/logger'

/**
 * 카테고리 크롤러
 */
export class CategoryCrawler {
  /**
   * 전체 카테고리 목록 수집
   */
  async crawlCategories(page: Page): Promise<Category[]> {
    logger.info('카테고리 크롤링 시작')

    try {
      // 메인 페이지로 이동
      await page.goto(`${config.dasis.baseUrl}/main/index.php`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      await delay(2000)

      // 세션 확인
      await this.checkSession(page)

      // 페이지 HTML 가져오기
      const html = await page.content()
      const $ = cheerio.load(html)

      const categories: Category[] = []
      const seenUrls = new Set<string>()

      // 1단계: 메인 페이지에서 대분류 카테고리 수집
      $('a[href*="goods_list.php?cateCd="]').each((index, element) => {
        const $el = $(element)
        const name = $el.text().trim()
        let url = $el.attr('href') || ''

        if (!name || !url) return

        // 상대 경로를 절대 경로로 변환
        if (!url.startsWith('http')) {
          url = url.replace(/^\.\./, '')
          url = url.startsWith('/') ? `${config.dasis.baseUrl}${url}` : `${config.dasis.baseUrl}/${url}`
        }

        // 중복 제거
        if (seenUrls.has(url)) return
        seenUrls.add(url)

        // cateCd 추출
        const cateCdMatch = url.match(/cateCd=(\d+)/)
        if (!cateCdMatch) return

        const cateCd = cateCdMatch[1]

        // 카테고리 레벨 결정 (cateCd 길이로 판단)
        // 3자리: 대분류 (예: 002, 013)
        // 6자리: 중분류 (예: 002001, 013003)
        let level = 1
        let parentId: string | undefined = undefined

        if (cateCd.length === 6) {
          level = 2
          parentId = cateCd.substring(0, 3)
        } else if (cateCd.length === 9) {
          level = 3
          parentId = cateCd.substring(0, 6)
        }

        categories.push({
          id: cateCd,
          name,
          url,
          parentId,
          level,
        })
      })

      logger.info(`1단계: 메인 페이지에서 ${categories.length}개 카테고리 수집`)

      // 2단계: 각 대분류 카테고리 페이지에서 하위 카테고리 수집
      const topLevelCategories = categories.filter((cat) => cat.level === 1)

      for (let i = 0; i < topLevelCategories.length; i++) {
        const category = topLevelCategories[i]

        logger.info(`[${i + 1}/${topLevelCategories.length}] ${category.name} 하위 카테고리 수집 중...`)

        try {
          await page.goto(category.url, {
            waitUntil: 'networkidle2',
            timeout: 60000,
          })

          await delay(1500)

          // 세션 확인
          await this.checkSession(page)

          const categoryHtml = await page.content()
          const $page = cheerio.load(categoryHtml)

          // .list_item_category 내의 하위 카테고리 링크 수집
          $page('.list_item_category a[href*="cateCd="]').each((index, element) => {
            const $el = $page(element)
            const subName = $el.find('span').text().trim() || $el.text().trim()
            let subUrl = $el.attr('href') || ''

            if (!subName || !subUrl) return

            // 상대 경로 처리
            if (subUrl.startsWith('?')) {
              // ?cateCd=003001 형태
              const baseUrl = category.url.split('?')[0]
              subUrl = baseUrl + subUrl
            } else if (!subUrl.startsWith('http')) {
              subUrl = subUrl.replace(/^\.\./, '')
              subUrl = subUrl.startsWith('/') ? `${config.dasis.baseUrl}${subUrl}` : `${config.dasis.baseUrl}/${subUrl}`
            }

            // 중복 제거
            if (seenUrls.has(subUrl)) return
            seenUrls.add(subUrl)

            // cateCd 추출
            const subCateCdMatch = subUrl.match(/cateCd=(\d+)/)
            if (!subCateCdMatch) return

            const subCateCd = subCateCdMatch[1]

            // 이미 수집된 카테고리인지 확인
            if (categories.some((c) => c.id === subCateCd)) return

            // 레벨 결정
            let subLevel = 2
            let subParentId = category.id

            if (subCateCd.length === 9) {
              subLevel = 3
              subParentId = subCateCd.substring(0, 6)
            }

            categories.push({
              id: subCateCd,
              name: subName,
              url: subUrl,
              parentId: subParentId,
              level: subLevel,
            })
          })

          logger.info(
            `  → ${category.name}: ${categories.filter((c) => c.parentId === category.id).length}개 하위 카테고리 발견`
          )
        } catch (error) {
          logger.warn(`  → ${category.name} 하위 카테고리 수집 실패`, error)
        }

        await delay(config.crawl.delayMs)
      }

      // 중복 제거 및 정렬
      const uniqueCategories = Array.from(new Map(categories.map((cat) => [cat.id, cat])).values()).sort((a, b) => {
        // level로 먼저 정렬, 같으면 id로 정렬
        if (a.level !== b.level) return a.level - b.level
        return a.id.localeCompare(b.id)
      })

      logger.success(
        `총 ${uniqueCategories.length}개 카테고리 수집 완료 (대분류: ${uniqueCategories.filter((c) => c.level === 1).length}, 중분류: ${uniqueCategories.filter((c) => c.level === 2).length}, 소분류: ${uniqueCategories.filter((c) => c.level === 3).length})`
      )

      return uniqueCategories
    } catch (error) {
      logger.error('카테고리 크롤링 실패', error)
      throw error
    }
  }

  /**
   * 세션 유효성 확인
   */
  private async checkSession(page: Page): Promise<void> {
    try {
      // 가격 요소가 있는지 확인
      const priceElements = await page.$$('.price, .goods_price, [class*="price"], .item_price')

      if (priceElements.length === 0) {
        logger.warn('세션 확인: 가격 요소를 찾을 수 없습니다. 세션이 만료되었을 수 있습니다.')
      }

      // 로그인 상태 확인 (예: 로그인 페이지로 리다이렉트되었는지)
      const currentUrl = page.url()
      if (currentUrl.includes('login') || currentUrl.includes('member')) {
        throw new Error('세션이 만료되었습니다. 로그인이 필요합니다. GD5SESSID 쿠키를 갱신하세요.')
      }

      // "로그인" 텍스트가 있는지 확인
      const loginText = await page.evaluate(() => {
        const text = document.body.innerText
        return text.includes('로그인하세요') || text.includes('로그인이 필요')
      })

      if (loginText) {
        logger.warn('세션 확인: 로그인 메시지 발견. 세션이 만료되었을 수 있습니다.')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('세션이 만료')) {
        throw error
      }
      logger.warn('세션 확인 중 오류 발생', error)
    }
  }

  /**
   * 카테고리별 제품 페이지 URL 추출
   */
  async getCategoryProductPageUrls(page: Page, categoryUrl: string): Promise<string[]> {
    logger.info(`카테고리 페이지 접근: ${categoryUrl}`)

    try {
      await page.goto(categoryUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      await delay(1000)

      const urls: string[] = [categoryUrl]

      return urls
    } catch (error) {
      logger.error(`카테고리 페이지 접근 실패: ${categoryUrl}`, error)
      return []
    }
  }
}
