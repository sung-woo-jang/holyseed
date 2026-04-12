import { AppDataSource } from '../src/database/seeds/data-source';
import { createInitialAdmin } from '../src/database/seeds/initial-admin.seed';

async function createAdmin() {
  console.log('🚀 Creating initial admin account...\n');

  try {
    // 데이터베이스 연결
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    // 관리자 계정 생성
    await createInitialAdmin();

    console.log('\n✅ Admin account creation completed!');
  } catch (error) {
    console.error('\n❌ Admin account creation failed:', error);
    process.exit(1);
  } finally {
    // 연결 종료
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// 스크립트 실행
createAdmin();
