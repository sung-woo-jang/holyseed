import { join } from 'path'
import { CustomValidationPipe } from '@common/pipes'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as dotenv from 'dotenv'
import { AppModule } from './app.module'

// Explicitly load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
dotenv.config({ path: envFile })


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const configService = app.get(ConfigService)
  const port = configService.get<number>('app.port', 8000)
  const environment = configService.get<string>('app.environment')

  // CORS 설정
  const corsOrigins = process.env.CORS_ORIGINS || ''
  const allowedOrigins = corsOrigins ? corsOrigins.split(',').map((origin) => origin.trim()) : []

  console.log('🌍 CORS_ORIGINS:', process.env.CORS_ORIGINS)
  console.log('🌍 Allowed Origins:', allowedOrigins)
  console.log('🌍 Environment:', environment)

  app.enableCors({
    origin: true, // 임시로 모든 Origin 허용
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/'],
  })

  // Global pipes - 한국어 에러 메시지를 제공하는 커스텀 ValidationPipe
  app.useGlobalPipes(new CustomValidationPipe())

  // 정적 파일 서빙 (업로드된 파일)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  })

  // Swagger 설정 (개발 환경에서만)
  if (environment === 'development') {
    // ========================================
    // ZC (전자제품 가격 비교) API 문서
    // ========================================
    const zcConfig = new DocumentBuilder()
      .setTitle('ZC (Zippt Crawler) API')
      .setDescription('전자제품 가격 비교 서비스 - Dasis 크롤링 데이터 제공')
      .setVersion('1.0')
      .addTag('ZC 카테고리', '제품 카테고리 조회')
      .addTag('ZC 제품', '제품 목록 및 상세 조회')
      .addTag('ZC 브랜드', '브랜드 목록 및 상세 조회')
      .addTag('ZC 가격 이력', '가격 변동 이력 조회')
      .build()

    const zcDocument = SwaggerModule.createDocument(app, zcConfig, {
      include: [], // 전체 문서 생성
    })

    // ZC API만 필터링 (/api/zc로 시작하는 경로)
    const filteredZcDocument = {
      ...zcDocument,
      paths: Object.fromEntries(Object.entries(zcDocument.paths).filter(([path]) => path.startsWith('/api/zc/'))),
    }

    SwaggerModule.setup('zc/docs', app, filteredZcDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'ZC API - 전자제품 가격 비교',
      jsonDocumentUrl: '/zc/docs/json',
    })

    // 로깅
    console.log('💎 [ZC] Swagger UI: http://localhost:8000/zc/docs')
    console.log('💎 [ZC] Swagger JSON: http://localhost:8000/zc/docs/json')
    console.log(`📊 [ZC] API 개수: ${Object.keys(filteredZcDocument.paths).length}개`)
  }

  await app.listen(port, '0.0.0.0')

  console.log(`🚀 Application is running on: http://localhost:${port}`)
  console.log(`🌍 Environment: ${environment}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  process.exit(0)
})

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error)
  process.exit(1)
})
