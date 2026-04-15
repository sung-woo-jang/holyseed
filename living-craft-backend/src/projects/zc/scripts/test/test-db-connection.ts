import 'dotenv/config'
import { DatabaseSaverV2 } from '../crawler/save-to-db-v2'
import { logger } from '../crawler/utils/logger'

/**
 * DB 연결 및 테이블 생성 테스트
 */
async function testDbConnection() {
  const saver = new DatabaseSaverV2()

  try {
    logger.info('=== DB 연결 테스트 시작 ===')

    // DB 초기화 (테이블 생성)
    await saver.initialize()

    // 통계 확인
    await saver.getStats()

    logger.success('\n✅ DB 연결 테스트 성공!')
  } catch (error) {
    logger.error('DB 연결 테스트 실패', error)
    throw error
  } finally {
    await saver.close()
  }
}

if (require.main === module) {
  testDbConnection()
    .then(() => {
      logger.success('테스트 완료')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('테스트 실패', error)
      process.exit(1)
    })
}
