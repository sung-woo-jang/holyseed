import { District } from '@lc/modules/admin/districts/entities/district.entity'
// Entities
import { User } from '@lc/modules/admin/users/entities/user.entity'
import { Customer } from '@lc/modules/customers/entities/customer.entity'
import { Icon } from '@lc/modules/icons/entities/icon.entity'
import { Portfolio } from '@lc/modules/portfolios/entities/portfolio.entity'
import { Reservation } from '@lc/modules/reservations/entities/reservation.entity'
import { Review } from '@lc/modules/reviews/entities/review.entity'
import { Service } from '@lc/modules/services/entities/service.entity'
import { Holiday } from '@lc/modules/settings/entities/holiday.entity'
import { OperatingSetting } from '@lc/modules/settings/entities/operating-setting.entity'
import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

// 환경 변수 로드
dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'living_craft',
  entities: [User, District, Icon, Customer, Service, OperatingSetting, Holiday, Reservation, Review, Portfolio],
  // synchronize: 항상 true (개발/프로덕션 모두)
  // 1인 운영 프로젝트로 편의성 우선, 자동 스키마 동기화 사용
  synchronize: true,
  logging: false,
})
