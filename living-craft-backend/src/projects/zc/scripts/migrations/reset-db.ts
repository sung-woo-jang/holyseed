import { config as envConfig } from 'dotenv'
import 'reflect-metadata'
import { DataSource } from 'typeorm'

envConfig()

async function resetDatabase() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_DATABASE || 'living_craft',
  })

  try {
    await dataSource.initialize()
    console.log('데이터베이스 연결 성공')

    // 외래키 순서로 삭제
    await dataSource.query('DELETE FROM zc.price_history')
    console.log('✓ price_history 삭제 완료')

    await dataSource.query('DELETE FROM zc.product_model_links')
    console.log('✓ product_model_links 삭제 완료')

    await dataSource.query('DELETE FROM zc.product_images')
    console.log('✓ product_images 삭제 완료')

    await dataSource.query('DELETE FROM zc.product_listings')
    console.log('✓ product_listings 삭제 완료')

    await dataSource.query('DELETE FROM zc.product_models')
    console.log('✓ product_models 삭제 완료')

    await dataSource.query('DELETE FROM zc.brands')
    console.log('✓ brands 삭제 완료')

    await dataSource.query('DELETE FROM zc.site_categories')
    console.log('✓ site_categories 삭제 완료')

    console.log('\n✅ DB 초기화 완료!')
  } catch (error) {
    console.error('❌ DB 초기화 실패:', error)
    throw error
  } finally {
    await dataSource.destroy()
  }
}

resetDatabase()
