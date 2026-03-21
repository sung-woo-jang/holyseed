import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'living_craft',
  entities: [
    path.join(__dirname, '../modules/**/*.entity.{ts,js}'),
    path.join(__dirname, '../common/**/*.entity.{ts,js}'),
  ],
  migrations: [
    path.join(__dirname, '../database/migrations/*{.ts,.js}'),
  ],
  synchronize: false,
  logging: false,
  migrationsRun: false,
  ssl: false,
});
