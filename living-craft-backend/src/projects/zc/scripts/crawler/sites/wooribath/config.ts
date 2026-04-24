import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Wooribath 사이트 설정
  wooribath: {
    baseUrl: 'https://www.wooribath.com',
    // Wooribath는 로그인 불필요 (공개 가격)
  },

  // 크롤링 설정
  crawl: {
    delayMs: parseInt(process.env.CRAWL_DELAY_MS || '2000', 10), // cafe24는 조금 더 여유롭게
  },

  // Puppeteer 설정
  puppeteer: {
    headless: process.env.HEADLESS !== 'false',
  },
}
