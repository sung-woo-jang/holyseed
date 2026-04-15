import * as path from 'path'
import { config as envConfig } from 'dotenv'
import * as fs from 'fs/promises'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Brand } from '../../modules/brands/entities/brand.entity'
import { PriceHistory } from '../../modules/price-history/entities/price-history.entity'
import { ProductImage } from '../../modules/product-images/entities/product-image.entity'
import { ProductListing } from '../../modules/product-listings/entities/product-listing.entity'
import { ProductModelLink } from '../../modules/product-model-links/entities/product-model-link.entity'
import { ProductModel } from '../../modules/product-models/entities/product-model.entity'
import { SiteCategory } from '../../modules/site-categories/entities/site-category.entity'
import { Site } from '../../modules/sites/entities/site.entity'
import { logger } from './utils/logger'

envConfig()

/**
 * 크롤링 데이터를 새로운 DB 구조(v2)에 저장하는 클래스
 */
export class DatabaseSaverV2 {
  private dataSource: DataSource
  private dasisSite: Site | null = null

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_DATABASE || 'living_craft',
      entities: [Site, SiteCategory, Brand, ProductListing, ProductModel, ProductModelLink, PriceHistory, ProductImage],
      synchronize: true, // 개발 환경에서만 true
      logging: false,
    })
  }

  /**
   * DB 연결 초기화
   */
  async initialize(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize()
      logger.success('데이터베이스 연결 성공')
    }

    // Dasis 사이트 초기화
    await this.initializeDasisSite()
  }

  /**
   * DB 연결 종료
   */
  async close(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
      logger.info('데이터베이스 연결 종료')
    }
  }

  /**
   * Dasis 사이트 초기화 (최초 1회)
   */
  private async initializeDasisSite(): Promise<void> {
    const siteRepository = this.dataSource.getRepository(Site)

    this.dasisSite = await siteRepository.findOne({
      where: { code: 'dasis' },
    })

    if (!this.dasisSite) {
      this.dasisSite = await siteRepository.save({
        code: 'dasis',
        name: '다시스',
        baseUrl: 'https://www.dasis.co.kr',
        isActive: true,
        crawlerConfig: {
          categoryUrlPattern: 'https://www.dasis.co.kr/shop/shopbrand.html?xcode={code}',
        },
      })
      logger.success('Dasis 사이트 등록 완료')
    }
  }

  /**
   * 카테고리 저장 (SiteCategory 테이블)
   */
  async saveCategories(categories: any[]): Promise<void> {
    if (!this.dasisSite) {
      throw new Error('Dasis 사이트가 초기화되지 않았습니다.')
    }

    logger.info(`${categories.length}개 카테고리 저장 중...`)

    const siteCategoryRepository = this.dataSource.getRepository(SiteCategory)

    let savedCount = 0
    let updatedCount = 0

    for (const cat of categories) {
      try {
        // siteCategoryCode로 기존 카테고리 찾기
        let siteCategory = await siteCategoryRepository.findOne({
          where: {
            siteId: this.dasisSite.id,
            siteCategoryCode: cat.id,
          },
        })

        if (siteCategory) {
          // 업데이트
          siteCategory.name = cat.name
          siteCategory.url = cat.url
          siteCategory.level = cat.level
          await siteCategoryRepository.save(siteCategory)
          updatedCount++
        } else {
          // 새로 생성
          siteCategory = siteCategoryRepository.create({
            siteId: this.dasisSite.id,
            siteCategoryCode: cat.id,
            name: cat.name,
            url: cat.url,
            level: cat.level,
          })
          await siteCategoryRepository.save(siteCategory)
          savedCount++
        }
      } catch (error) {
        logger.warn(`카테고리 저장 실패: ${cat.name}`, error)
      }
    }

    // parentId 매핑 (2차 패스)
    for (const cat of categories) {
      if (cat.parentId) {
        try {
          const siteCategory = await siteCategoryRepository.findOne({
            where: {
              siteId: this.dasisSite.id,
              siteCategoryCode: cat.id,
            },
          })

          const parentCategory = await siteCategoryRepository.findOne({
            where: {
              siteId: this.dasisSite.id,
              siteCategoryCode: cat.parentId,
            },
          })

          if (siteCategory && parentCategory) {
            siteCategory.parentId = parentCategory.id
            await siteCategoryRepository.save(siteCategory)
          }
        } catch (error) {
          logger.warn(`parentId 매핑 실패: ${cat.name}`, error)
        }
      }
    }

    logger.success(`카테고리 저장 완료 (신규: ${savedCount}, 업데이트: ${updatedCount})`)
  }

  /**
   * 제품 저장 (ProductListing 테이블)
   */
  async saveProducts(products: any[]): Promise<void> {
    if (!this.dasisSite) {
      throw new Error('Dasis 사이트가 초기화되지 않았습니다.')
    }

    logger.info(`${products.length}개 제품 저장 중...`)

    const productListingRepository = this.dataSource.getRepository(ProductListing)
    const siteCategoryRepository = this.dataSource.getRepository(SiteCategory)
    const brandRepository = this.dataSource.getRepository(Brand)
    const priceHistoryRepository = this.dataSource.getRepository(PriceHistory)
    const imageRepository = this.dataSource.getRepository(ProductImage)

    let savedCount = 0
    let updatedCount = 0

    for (const prod of products) {
      try {
        // 1. Brand 확인/생성
        let brand: Brand | null = null
        if (prod.brandName) {
          brand = await brandRepository.findOne({
            where: { name: prod.brandName },
          })

          if (!brand) {
            brand = await brandRepository.save({
              name: prod.brandName,
            })
          }
        }

        // 2. SiteCategory 찾기
        const siteCategory = await siteCategoryRepository.findOne({
          where: {
            siteId: this.dasisSite.id,
            siteCategoryCode: prod.categoryId,
          },
        })

        if (!siteCategory) {
          logger.warn(`카테고리를 찾을 수 없음: ${prod.categoryId} (제품: ${prod.name})`)
          continue
        }

        // 3. ProductListing 확인/업데이트
        let listing = await productListingRepository.findOne({
          where: {
            siteId: this.dasisSite.id,
            siteProductId: prod.goodsNo,
          },
        })

        const isNewListing = !listing // 신규 생성 여부 미리 확인

        const priceChanged =
          listing && (listing.currentPrice !== prod.price || listing.currentDiscountPrice !== prod.discountPrice)

        if (listing) {
          // 업데이트
          listing.productName = prod.name
          listing.extractedModelName = prod.modelName?.substring(0, 100) || null
          listing.currentPrice = prod.price
          listing.currentDiscountPrice = prod.discountPrice
          listing.description = prod.description
          listing.specifications = prod.specifications
          listing.manufacturer = prod.manufacturer?.substring(0, 100) || null
          listing.origin = prod.origin?.substring(0, 100) || null
          listing.productUrl = prod.detailPageUrl
          listing.siteCategoryId = siteCategory.id
          listing.brandId = brand?.id || null
          listing.lastCrawledAt = new Date()

          await productListingRepository.save(listing)
          updatedCount++
        } else {
          // 신규 생성
          listing = await productListingRepository.save({
            siteId: this.dasisSite.id,
            siteCategoryId: siteCategory.id,
            brandId: brand?.id || null,
            siteProductId: prod.goodsNo,
            productName: prod.name,
            extractedModelName: prod.modelName?.substring(0, 100) || null,
            currentPrice: prod.price,
            currentDiscountPrice: prod.discountPrice,
            description: prod.description,
            specifications: prod.specifications,
            productUrl: prod.detailPageUrl,
            manufacturer: prod.manufacturer?.substring(0, 100) || null,
            origin: prod.origin?.substring(0, 100) || null,
            isAvailable: true,
            lastCrawledAt: new Date(),
          })
          savedCount++
        }

        // 4. 가격 변동 시 PriceHistory 추가
        const shouldAddHistory = isNewListing || priceChanged

        if (shouldAddHistory) {
          await priceHistoryRepository.save({
            listingId: listing.id,
            price: prod.price,
            discountPrice: prod.discountPrice || null,
            recordedAt: new Date(),
            isAvailable: true,
          })

          if (priceChanged) {
            logger.info(`가격 변동 감지: ${prod.name} (${listing.currentPrice} → ${prod.price})`)
          }
        }

        // 5. 이미지 저장 (신규 생성 시에만)
        if (!listing.createdAt) {
          if (prod.thumbnailUrl) {
            await imageRepository.save({
              listingId: listing.id,
              originalUrl: prod.thumbnailUrl,
              localPath: null,
              type: 'thumbnail',
              sortOrder: 0,
            })
          }

          if (prod.additionalImages && prod.additionalImages.length > 0) {
            for (let i = 0; i < prod.additionalImages.length; i++) {
              await imageRepository.save({
                listingId: listing.id,
                originalUrl: prod.additionalImages[i],
                localPath: null,
                type: 'detail',
                sortOrder: i + 1,
              })
            }
          }
        }
      } catch (error) {
        logger.warn(`제품 저장 실패: ${prod.name}`, error)
      }
    }

    logger.success(`제품 저장 완료 (신규: ${savedCount}, 업데이트: ${updatedCount})`)
  }

  /**
   * 저장된 통계
   */
  async getStats(): Promise<void> {
    const siteCategoryRepository = this.dataSource.getRepository(SiteCategory)
    const productListingRepository = this.dataSource.getRepository(ProductListing)
    const brandRepository = this.dataSource.getRepository(Brand)
    const priceHistoryRepository = this.dataSource.getRepository(PriceHistory)

    const totalCategories = await siteCategoryRepository.count({
      where: { siteId: this.dasisSite!.id },
    })
    const totalListings = await productListingRepository.count({
      where: { siteId: this.dasisSite!.id },
    })
    const totalBrands = await brandRepository.count()
    const totalPriceHistory = await priceHistoryRepository.count()

    logger.info('\n=== DB 저장 통계 (v2 구조) ===')
    logger.info(`사이트: ${this.dasisSite!.name} (${this.dasisSite!.code})`)
    logger.info(`카테고리: ${totalCategories}개`)
    logger.info(`브랜드: ${totalBrands}개`)
    logger.info(`제품 리스팅: ${totalListings}개`)
    logger.info(`가격 이력: ${totalPriceHistory}개`)
  }
}

/**
 * CLI에서 직접 실행 시
 */
async function main() {
  const saver = new DatabaseSaverV2()

  try {
    await saver.initialize()

    // 크롤링 결과 파일 읽기
    const dataDir = path.join(process.cwd(), 'downloads', 'data')

    // 카테고리 저장
    const categoriesPath = path.join(dataDir, 'test-categories.json')
    const categoriesData = await fs.readFile(categoriesPath, 'utf-8')
    const categories = JSON.parse(categoriesData)

    await saver.saveCategories(categories)

    // 제품 저장 (있는 경우)
    try {
      const productsPath = path.join(dataDir, 'products.json')
      const productsData = await fs.readFile(productsPath, 'utf-8')
      const products = JSON.parse(productsData)

      if (products.length > 0) {
        await saver.saveProducts(products)
      }
    } catch (error) {
      logger.info('제품 데이터 없음 (카테고리만 저장)')
    }

    await saver.getStats()

    logger.success('\n✅ DB 저장 완료 (v2 구조)!')
  } catch (error) {
    logger.error('DB 저장 중 오류 발생', error)
    throw error
  } finally {
    await saver.close()
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('치명적 오류', error)
    process.exit(1)
  })
}

export default DatabaseSaverV2
