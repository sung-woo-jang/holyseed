import puppeteer, { Browser, Page } from 'puppeteer'
import { logger } from '../utils/logger'

export interface CookieOptions {
  name: string
  value: string
  domain: string
  path?: string
  httpOnly?: boolean
  secure?: boolean
}

/**
 * Puppeteer 브라우저 관리 클래스
 */
export class BrowserManager {
  private browser: Browser | null = null
  private headless: boolean
  private cookies: CookieOptions[]

  constructor(headless: boolean = true, cookies: CookieOptions[] = []) {
    this.headless = headless
    this.cookies = cookies
  }

  /**
   * 브라우저 초기화
   */
  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser
    }

    logger.info('브라우저 실행 중...')

    this.browser = await puppeteer.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    })

    logger.success('브라우저 실행 완료')

    return this.browser
  }

  /**
   * 새 페이지 생성 및 기본 설정
   */
  async newPage(): Promise<Page> {
    const browser = await this.launch()
    const page = await browser.newPage()

    // 뷰포트 설정
    await page.setViewport({
      width: 1920,
      height: 1080,
    })

    // User-Agent 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // 쿠키 설정
    for (const cookie of this.cookies) {
      await page.setCookie(cookie)
      logger.info(`쿠키 설정 완료: ${cookie.name}`)
    }

    return page
  }

  /**
   * 브라우저 종료
   */
  async close(): Promise<void> {
    if (this.browser) {
      logger.info('브라우저 종료 중...')
      await this.browser.close()
      this.browser = null
      logger.success('브라우저 종료 완료')
    }
  }
}
