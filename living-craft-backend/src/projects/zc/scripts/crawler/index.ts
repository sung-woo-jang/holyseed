import 'dotenv/config'
import { DasisCrawler } from './sites/dasis'
import { WooribathCrawler } from './sites/wooribath'
import { parseCrawlOptions } from './sites/dasis/config'
import { logger } from './utils/logger'

/**
 * 크롤러 CLI 메인 진입점
 *
 * 사용법:
 * npm run crawl -- --site=dasis --include=001
 * npm run crawl -- --site=wooribath --include=양변기
 */

function parseSite(): string {
  const args = process.argv.slice(2)

  for (const arg of args) {
    if (arg.startsWith('--site=')) {
      return arg.split('=')[1]
    }
  }

  // 기본값: dasis
  return 'dasis'
}

async function main() {
  const site = parseSite()
  const options = parseCrawlOptions()

  logger.info(`사이트: ${site}`)
  if (Object.keys(options).length > 0) {
    logger.info('크롤링 옵션:')
    logger.info(JSON.stringify(options, null, 2))
  }

  switch (site) {
    case 'dasis': {
      const crawler = new DasisCrawler()
      await crawler.crawlAll(options)
      break
    }

    case 'wooribath': {
      const crawler = new WooribathCrawler()
      await crawler.crawlAll(options)
      break
    }

    default: {
      logger.error(`지원하지 않는 사이트입니다: ${site}`)
      logger.info('사용 가능한 사이트: dasis, wooribath')
      process.exit(1)
    }
  }

  logger.success('크롤링이 성공적으로 완료되었습니다.')
}

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      logger.error('크롤링 실패', error)
      process.exit(1)
    })
}
