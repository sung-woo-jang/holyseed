import { createCustomers } from './customers.seed'
import { AppDataSource } from './data-source'
import { createDistricts } from './districts.seed'
import { createHolidays } from './holidays.seed'
import { createIcons } from './icons.seed'
import { createInitialAdmin } from './initial-admin.seed'
import { createOperatingSettings } from './operating-settings.seed'
import { createPortfolios } from './portfolios.seed'
import { createReservations } from './reservations.seed'
import { createReviews } from './reviews.seed'
import { createServices } from './services.seed'

async function runSeeds() {
  console.log('🚀 Starting database seeding...\n')

  try {
    // 데이터베이스 연결
    await AppDataSource.initialize()
    console.log('✅ Database connection established\n')

    // Seed 실행 (순서 중요)
    // 1. 관리자 계정
    await createInitialAdmin()

    // 2. 지역 데이터 (서비스 지역 설정에 필요)
    await createDistricts()

    // 3. 아이콘 마스터 데이터 (서비스에서 FK로 참조)
    await createIcons()

    // 4. 서비스 데이터 + 서비스 가능 지역
    await createServices()

    // 5. 운영 시간 설정
    await createOperatingSettings()

    // Phase 2: 고객 및 예약 데이터
    console.log('\n📌 Phase 2: 고객 및 예약 데이터')
    await createCustomers()
    await createReservations()
    await createReviews()

    // Phase 3: 포트폴리오 및 휴무일
    console.log('\n📌 Phase 3: 포트폴리오 및 휴무일')
    await createPortfolios()
    await createHolidays()

    console.log('\n✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error)
    process.exit(1)
  } finally {
    // 연결 종료
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
      console.log('🔌 Database connection closed')
    }
  }
}

// 스크립트 실행
runSeeds()
