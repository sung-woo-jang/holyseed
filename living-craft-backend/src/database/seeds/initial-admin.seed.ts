import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { User } from '@modules/admin/users/entities/user.entity';
import { UserRole, UserStatus } from '@common/enums';

export async function createInitialAdmin() {
  console.log('🌱 Starting initial admin seed...');

  try {
    // TypeORM 데이터 소스 초기화
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }

    const userRepository = AppDataSource.getRepository(User);

    // 기존 관리자 계정 확인
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin account already exists. Skipping...');
      return;
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 관리자 계정 생성
    const admin = userRepository.create({
      email: 'admin@example.com',
      password: hashedPassword,
      username: 'admin',
      firstName: '관리자',
      lastName: '시스템',
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
      phoneNumber: '010-0000-0000',
    });

    await userRepository.save(admin);

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: Password123!');
    console.log('👤 Role: SUPERADMIN');
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    throw error;
  }
}
