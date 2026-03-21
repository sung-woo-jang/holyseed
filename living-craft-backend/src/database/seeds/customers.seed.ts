import { AppDataSource } from './data-source';
import { Customer } from '@modules/customers/entities/customer.entity';
import { faker } from '@faker-js/faker/locale/ko';

export async function createCustomers(): Promise<void> {
  console.log('🔧 Starting customers seed...');

  const customerRepository = AppDataSource.getRepository(Customer);

  // 기존 데이터 체크 (멱등성)
  const existingCount = await customerRepository.count();
  if (existingCount > 0) {
    console.log('ℹ️  Customers already exist. Skipping...');
    return;
  }

  const customers: Customer[] = [];

  for (let i = 0; i < 20; i++) {
    const customer = customerRepository.create({
      name: faker.person.fullName(),
      phone: `010-${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
      email: i < 16 ? faker.internet.email() : null, // 80%는 이메일 있음
      tossUserId: i < 4 ? `toss_user_${faker.string.alphanumeric(8)}` : null, // 20%는 토스 유저
      refreshToken: null,
    });

    const saved = await customerRepository.save(customer);
    customers.push(saved);
  }

  console.log(`✅ Created ${customers.length} customers`);
  console.log(`   - With Email: ${customers.filter((c) => c.email).length}`);
  console.log(
    `   - Toss Users: ${customers.filter((c) => c.tossUserId).length}`,
  );
}
