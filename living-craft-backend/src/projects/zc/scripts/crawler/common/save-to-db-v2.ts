import * as path from 'path'
import { config as envConfig } from 'dotenv'
import * as fs from 'fs/promises'
import 'reflect-metadata'
import { DataSource, Between } from 'typeorm'
import { Brand } from '../../../modules/brands/entities/brand.entity'
import { Category } from '../../../modules/categories/entities/category.entity'
import { PriceHistory } from '../../../modules/price-history/entities/price-history.entity'
import { ProductImage } from '../../../modules/product-images/entities/product-image.entity'
import { ProductListing } from '../../../modules/product-listings/entities/product-listing.entity'
import { ProductModelLink } from '../../../modules/product-model-links/entities/product-model-link.entity'
import { ProductModel } from '../../../modules/product-models/entities/product-model.entity'
import { SiteCategory } from '../../../modules/site-categories/entities/site-category.entity'
import { Site } from '../../../modules/sites/entities/site.entity'
import { logger } from '../utils/logger'

envConfig()

/**
 * 크롤링 데이터를 새로운 DB 구조(v2)에 저장하는 클래스
 */
export class DatabaseSaverV2 {
  private dataSource: DataSource
  private sites: Map<string, Site> = new Map()

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_DATABASE || 'living_craft',
      entities: [Site, SiteCategory, Brand, Category, ProductListing, ProductModel, ProductModelLink, PriceHistory, ProductImage],
      // synchronize: 항상 true (개발/프로덕션 모두)
      synchronize: true,
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

    // 기본 사이트 초기화
    await this.initializeSite('dasis', '다시스', 'https://www.dasis.co.kr')
    await this.initializeSite('wooribath', '우리욕실', 'https://www.wooribath.com')
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
   * 사이트 초기화 (최초 1회)
   */
  private async initializeSite(code: string, name: string, baseUrl: string): Promise<void> {
    const siteRepository = this.dataSource.getRepository(Site)

    let site = await siteRepository.findOne({
      where: { code },
    })

    if (!site) {
      site = await siteRepository.save({
        code,
        name,
        baseUrl,
        isActive: true,
        crawlerConfig: {},
      })
      logger.success(`${name} 사이트 등록 완료`)
    }

    this.sites.set(code, site)
  }

  /**
   * 카테고리 저장 (SiteCategory 테이블)
   */
  async saveCategories(categories: any[], siteCode: string = 'dasis'): Promise<void> {
    const site = this.sites.get(siteCode)
    if (!site) {
      throw new Error(`사이트가 초기화되지 않았습니다: ${siteCode}`)
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
            siteId: site.id,
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
            siteId: site.id,
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
              siteId: site.id,
              siteCategoryCode: cat.id,
            },
          })

          const parentCategory = await siteCategoryRepository.findOne({
            where: {
              siteId: site.id,
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
  async saveProducts(products: any[], siteCode: string = 'dasis'): Promise<void> {
    const site = this.sites.get(siteCode)
    if (!site) {
      throw new Error(`사이트가 초기화되지 않았습니다: ${siteCode}`)
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
            siteId: site.id,
            siteCategoryCode: prod.categoryId,
          },
        })

        if (!siteCategory) {
          logger.warn(`카테고리를 찾을 수 없음: ${prod.categoryId} (제품: ${prod.name})`)
          continue
        }

        // 3. ProductListing 확인/업데이트 (수동 row는 건드리지 않음)
        let listing = await productListingRepository.findOne({
          where: {
            siteId: site.id,
            siteProductId: prod.goodsNo,
            isManual: false,
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
            siteId: site.id,
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

        // 4. 가격 이력 추가 (일일 스냅샷 방식)
        // 오늘 날짜에 이미 가격 이력이 있는지 확인
        const today = new Date()
        today.setHours(0, 0, 0, 0) // 오늘 00:00:00
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1) // 내일 00:00:00

        const todayHistory = await priceHistoryRepository.findOne({
          where: {
            listingId: listing.id,
            recordedAt: Between(today, tomorrow),
          },
          order: { recordedAt: 'DESC' },
        })

        // 오늘 날짜에 이력이 없으면 추가 (일일 스냅샷)
        const shouldAddHistory = isNewListing || !todayHistory

        if (shouldAddHistory) {
          await priceHistoryRepository.save({
            listingId: listing.id,
            price: prod.price,
            discountPrice: prod.discountPrice || null,
            recordedAt: new Date(),
            isAvailable: true,
          })
        }

        // 가격 변동 로깅
        if (priceChanged) {
          logger.info(`가격 변동 감지: ${prod.name} (이전: ${listing.currentPrice}원 → 현재: ${prod.price}원)`)
        }

        // 5. 이미지 저장 (thumbnail이 없으면 저장)
        if (prod.thumbnailUrl) {
          const existingThumbnail = await imageRepository.findOne({
            where: {
              listingId: listing.id,
              type: 'thumbnail',
            },
          })

          if (!existingThumbnail) {
            await imageRepository.save({
              listingId: listing.id,
              originalUrl: prod.thumbnailUrl,
              localPath: null,
              type: 'thumbnail',
              sortOrder: 0,
            })
          }
        }

        // 추가 이미지 (신규 생성 시에만)
        if (!listing.createdAt && prod.additionalImages && prod.additionalImages.length > 0) {
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

    logger.info('\n=== DB 저장 통계 (v2 구조) ===')

    // 사이트별 통계
    for (const [code, site] of this.sites) {
      const totalCategories = await siteCategoryRepository.count({
        where: { siteId: site.id },
      })
      const totalListings = await productListingRepository.count({
        where: { siteId: site.id },
      })

      logger.info(`\n${site.name} (${code}):`)
      logger.info(`  카테고리: ${totalCategories}개`)
      logger.info(`  제품 리스팅: ${totalListings}개`)
    }

    // 전체 통계
    const totalBrands = await brandRepository.count()
    const totalPriceHistory = await priceHistoryRepository.count()

    logger.info(`\n전체:`)
    logger.info(`  브랜드: ${totalBrands}개`)
    logger.info(`  가격 이력: ${totalPriceHistory}개`)
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
