import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Entities
import { User } from '@modules/admin/users/entities/user.entity';
import { District } from '@modules/admin/districts/entities/district.entity';
import { Icon } from '@modules/icons/entities/icon.entity';
import { Customer } from '@modules/customers/entities/customer.entity';
import { Service } from '@modules/services/entities/service.entity';
import { ServiceRegion } from '@modules/services/entities/service-region.entity';
import { OperatingSetting } from '@modules/settings/entities/operating-setting.entity';
import { Holiday } from '@modules/settings/entities/holiday.entity';
import { Reservation } from '@modules/reservations/entities/reservation.entity';
import { Review } from '@modules/reviews/entities/review.entity';
import { Portfolio } from '@modules/portfolios/entities/portfolio.entity';

// 환경 변수 로드
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'living_craft',
  entities: [
    User,
    District,
    Icon,
    Customer,
    Service,
    ServiceRegion,
    OperatingSetting,
    Holiday,
    Reservation,
    Review,
    Portfolio,
  ],
  synchronize: false, // 마이그레이션으로 테이블 생성 후 시드 실행할 것
  logging: false,
});
