import * as path from 'path'
import 'dotenv/config'
import * as fs from 'fs/promises'
import { BrowserManager } from './crawlers/browser'
import { CategoryCrawler } from './crawlers/category-crawler'
import { logger } from './utils/logger'

/**
 * 카테고리 크롤링 테스트
 */
async function main() {
  const browserManager = new BrowserManager()
  const categoryCrawler = new CategoryCrawler()

  try {
    logger.info('=== 카테고리 크롤링 테스트 ===')

    const page = await browserManager.newPage()

    // 카테고리 수집
    const categories = await categoryCrawler.crawlCategories(page)

    // 레벨별 통계
    const level1 = categories.filter((c) => c.level === 1)
    const level2 = categories.filter((c) => c.level === 2)
    const level3 = categories.filter((c) => c.level === 3)

    logger.success(`\n총 ${categories.length}개 카테고리 수집 완료`)
    logger.info(`대분류: ${level1.length}개`)
    logger.info(`중분류: ${level2.length}개`)
    logger.info(`소분류: ${level3.length}개`)

    // 대분류별 하위 카테고리 수
    logger.info('\n대분류별 하위 카테고리:')
    level1.forEach((cat) => {
      const children = categories.filter((c) => c.parentId === cat.id)
      logger.info(`  ${cat.name} (${cat.id}): ${children.length}개 하위`)
    })

    // 샘플 출력 - 세면기 카테고리
    const semyeongi = categories.find((c) => c.name.includes('세면기') && c.level === 1)
    if (semyeongi) {
      logger.info(`\n세면기 하위 카테고리 상세:`)
      const children = categories.filter((c) => c.parentId === semyeongi.id)
      children.forEach((child) => {
        logger.info(`  - ${child.name} (${child.id})`)
      })
    }

    // 결과 저장
    const outputPath = path.join(process.cwd(), 'downloads', 'data', 'test-categories.json')
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, JSON.stringify(categories, null, 2), 'utf-8')

    logger.success(`\n결과 저장: ${outputPath}`)
  } catch (error) {
    logger.error('테스트 중 오류 발생', error)
    throw error
  } finally {
    await browserManager.close()
  }
}

main().catch((error) => {
  logger.error('치명적 오류', error)
  process.exit(1)
})
