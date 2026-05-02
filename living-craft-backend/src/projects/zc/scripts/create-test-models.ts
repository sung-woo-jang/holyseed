import 'dotenv/config'
import { DataSource } from 'typeorm'
import { ProductModel } from '../modules/product-models/entities/product-model.entity'
import { ProductListing } from '../modules/product-listings/entities/product-listing.entity'
import { ProductModelLink } from '../modules/product-model-links/entities/product-model-link.entity'
import { Brand } from '../modules/brands/entities/brand.entity'
import { Site } from '../modules/sites/entities/site.entity'
import { SiteCategory } from '../modules/site-categories/entities/site-category.entity'
import { PriceHistory } from '../modules/price-history/entities/price-history.entity'
import { ProductImage } from '../modules/product-images/entities/product-image.entity'

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'living_craft',
  entities: [Site, SiteCategory, Brand, ProductListing, ProductModel, ProductModelLink, PriceHistory, ProductImage],
  synchronize: true,
  logging: false,
})

async function main() {
  console.log('=== ProductModel 테스트 데이터 생성 ===')

  await dataSource.initialize()
  console.log('DB 연결 완료')

  const productModelRepo = dataSource.getRepository(ProductModel)
  const productListingRepo = dataSource.getRepository(ProductListing)
  const productModelLinkRepo = dataSource.getRepository(ProductModelLink)

  // 1. ProductModel 생성
  const models = [
    {
      brandId: '8ae40233-d2bc-40b9-927d-5d36a774ee7b', // VIVANT
      modelName: 'XA600',
      displayName: 'VIVANT XA600 샤워기',
      description: 'VIVANT XA600 모델 샤워기',
      isActive: true,
      materialCost: 280000,
      marginRate: 25,
    },
    {
      brandId: '2fa1a14c-3d96-4acf-a71d-29d492022cac', // 아메리칸 스탠다드
      modelName: 'AS-SHOWER',
      displayName: '아메리칸 스탠다드 샤워줄',
      description: '아메리칸 스탠다드 표준 샤워줄',
      isActive: true,
      materialCost: 15000,
      marginRate: 66.7,
    },
    {
      brandId: '0591fb8e-e535-4de0-bf0c-ef2c016dafff', // 그로헤
      modelName: 'GH-SHOWER',
      displayName: '그로헤 샤워 수전',
      description: '그로헤 샤워 수전 시리즈',
      isActive: true,
      materialCost: 300000,
      marginRate: 50,
    },
  ]

  for (const modelData of models) {
    const model = productModelRepo.create(modelData)
    await productModelRepo.save(model)
    console.log(`✅ ProductModel 생성: ${model.displayName} (${model.id})`)
  }

  // 2. 제품명 기반으로 Listing 찾아서 extractedModelName 업데이트
  console.log('\n=== ProductListing extractedModelName 업데이트 ===')

  const vivantListings = await productListingRepo.find({
    where: [
      { productName: 'VIVANT XA600(MS) 샤워' },
    ],
  })

  for (const listing of vivantListings) {
    listing.extractedModelName = 'XA600'
    await productListingRepo.save(listing)
    console.log(`✅ Listing 업데이트: ${listing.productName} -> extractedModelName: XA600`)
  }

  const asListings = await productListingRepo
    .createQueryBuilder('listing')
    .where('listing.productName LIKE :pattern', { pattern: '%아메리칸 스탠다드%샤워줄%' })
    .getMany()

  for (const listing of asListings) {
    listing.extractedModelName = 'AS-SHOWER'
    await productListingRepo.save(listing)
    console.log(`✅ Listing 업데이트: ${listing.productName} -> extractedModelName: AS-SHOWER`)
  }

  console.log('\n=== 완료 ===')
  console.log(`생성된 ProductModel: ${models.length}개`)
  console.log(`업데이트된 ProductListing: ${vivantListings.length + asListings.length}개`)

  await dataSource.destroy()
}

main().catch((error) => {
  console.error('오류 발생:', error)
  process.exit(1)
})
