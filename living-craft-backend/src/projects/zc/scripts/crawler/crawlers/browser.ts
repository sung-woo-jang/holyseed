import puppeteer, { Browser, Page } from 'puppeteer'
import { config } from '../config'
import { logger } from '../utils/logger'

/**
 * Puppeteer 브라우저 관리 클래스
 */
export class BrowserManager {
  private browser: Browser | null = null

  /**
   * 브라우저 초기화
   */
  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser
    }

    logger.info('브라우저 실행 중...')

    this.browser = await puppeteer.launch({
      headless: config.puppeteer.headless,
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

    // Dasis 쿠키 설정 (로그인 상태 유지)
    if (config.dasis.cookieGD5SESSID) {
      await page.setCookie({
        name: 'GD5SESSID',
        value: config.dasis.cookieGD5SESSID,
        domain: '.dasis.co.kr',
        path: '/',
        httpOnly: false,
        secure: false,
      })

      logger.info('Dasis 로그인 쿠키 설정 완료')
    } else {
      logger.warn('GD5SESSID 쿠키가 설정되지 않았습니다. 가격 정보를 볼 수 없을 수 있습니다.')
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
