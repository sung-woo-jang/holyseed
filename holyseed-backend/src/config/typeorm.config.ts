import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'holyseed',
  entities: [
    path.join(__dirname, '../modules/**/*.entity.{ts,js}'),
    path.join(__dirname, '../common/**/*.entity.{ts,js}'),
  ],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  // synchronize: true 고정 (개발/프로덕션 모두)
  // 이유: 1인 운영 프로젝트로 데이터 중요도가 낮고, 편의성 우선
  synchronize: true,
  logging: false,
  migrationsRun: false,
  ssl: false,
});
