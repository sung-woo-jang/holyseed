import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Dasis 사이트 설정
  dasis: {
    cookieGD5SESSID: process.env.DASIS_COOKIE_GD5SESSID || '',
    baseUrl: process.env.DASIS_BASE_URL || 'https://www.dasis.co.kr',
  },

  // PostgreSQL 설정
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'zippt',
    schema: process.env.DB_SCHEMA || 'public',
  },

  // 크롤링 설정
  crawl: {
    delayMs: parseInt(process.env.CRAWL_DELAY_MS || '1000', 10),
    maxConcurrentPages: parseInt(process.env.MAX_CONCURRENT_PAGES || '3', 10),
    downloadImages: process.env.DOWNLOAD_IMAGES === 'true',
    imagesDir: process.env.IMAGES_DIR || path.join(process.cwd(), 'downloads', 'images'),
  },

  // Puppeteer 설정
  puppeteer: {
    headless: process.env.HEADLESS !== 'false',
  },
}
