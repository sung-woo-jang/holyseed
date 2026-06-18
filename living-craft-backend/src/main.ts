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
    // AD (자산일기) API 문서
    // ========================================
    const adConfig = new DocumentBuilder()
      .setTitle('AD (Asset Diary) API')
      .setDescription('자산일기 - 가구 자산 스냅샷·거래·정기지출 관리 서비스')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('AD 인증', '토스 appLogin 연동 인증')
      .addTag('AD 사용자', '사용자 프로필 관리')
      .addTag('AD 가구', '가구 워크스페이스 관리')
      .addTag('AD 멤버십', '가구 멤버 역할 관리')
      .addTag('AD 초대', '가구 초대 코드 관리')
      .addTag('AD 카테고리', '거래 카테고리 관리')
      .addTag('AD 자산', '자산 CRUD 및 아카이브')
      .addTag('AD 자산 스냅샷', '자산 평가액 스냅샷')
      .addTag('AD 거래', '거래 내역 관리')
      .addTag('AD 정기지출', '정기 거래 템플릿 관리')
      .addTag('AD 대시보드', '홈 대시보드 집계')
      .addTag('AD 현금흐름', '기간별 현금흐름 분석')
      .addTag('AD 연간 비교', '연도별 자산 비교')
      .build()

    const adDocument = SwaggerModule.createDocument(app, adConfig, {
      include: [],
    })

    const filteredAdDocument = {
      ...adDocument,
      paths: Object.fromEntries(Object.entries(adDocument.paths).filter(([path]) => path.startsWith('/api/ad/'))),
    }

    SwaggerModule.setup('ad/docs', app, filteredAdDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'AD API - 자산일기',
      jsonDocumentUrl: '/ad/docs/json',
    })

    console.log('💎 [AD] Swagger UI: http://localhost:8000/ad/docs')
    console.log('💎 [AD] Swagger JSON: http://localhost:8000/ad/docs/json')
    console.log(`📊 [AD] API 개수: ${Object.keys(filteredAdDocument.paths).length}개`)

    // ========================================
    // PC (단가표 비교) API 문서
    // ========================================
    const pcConfig = new DocumentBuilder()
      .setTitle('PC (Price Compare) API')
      .setDescription('단가표 업체별 비교 - 공급업체별 제품 단가 관리')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('PC 인증', '단가표 관리 로그인')
      .addTag('PC 카테고리', '제품 카테고리 트리 관리')
      .addTag('PC 업체', '공급업체 관리')
      .addTag('PC 제품', '제품 CRUD, 비교, 임포트')
      .addTag('PC 제품 이미지', '제품 이미지 업로드/삭제')
      .addTag('PC 가격', '업체별 제품 단가 관리')
      .build()

    const pcDocument = SwaggerModule.createDocument(app, pcConfig, { include: [] })

    const filteredPcDocument = {
      ...pcDocument,
      paths: Object.fromEntries(Object.entries(pcDocument.paths).filter(([path]) => path.startsWith('/api/pc/'))),
    }

    SwaggerModule.setup('pc/docs', app, filteredPcDocument, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
      customSiteTitle: 'PC API - 단가표 비교',
      jsonDocumentUrl: '/pc/docs/json',
    })

    console.log('💎 [PC] Swagger UI: http://localhost:8000/pc/docs')
    console.log('💎 [PC] Swagger JSON: http://localhost:8000/pc/docs/json')
    console.log(`📊 [PC] API 개수: ${Object.keys(filteredPcDocument.paths).length}개`)

    // ========================================
    // IV (Infinite+VR 자동매매) API 문서
    // ========================================
    const ivConfig = new DocumentBuilder()
      .setTitle('IV (Infinite+VR) API')
      .setDescription('라오어 무한매수법 V4.0 + 밸류리밸런싱 VR5.0 자동매매 관리')
      .setVersion('1.0')
      .addTag('IV 전략', '전략 생성/조회/삭제')
      .addTag('IV 계획', '일별 LOC 매수매도 계획')
      .addTag('IV 체결', '체결 내역 입력 및 상태 갱신')
      .addTag('IV 사이클', '사이클 종료 및 새 사이클 시작')
      .addTag('IV 시세', 'Yahoo Finance 종가 fetch')
      .build()

    const ivDocument = SwaggerModule.createDocument(app, ivConfig, { include: [] })

    const filteredIvDocument = {
      ...ivDocument,
      paths: Object.fromEntries(Object.entries(ivDocument.paths).filter(([path]) => path.startsWith('/api/iv/'))),
    }

    SwaggerModule.setup('iv/docs', app, filteredIvDocument, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
      customSiteTitle: 'IV API - 자동매매',
      jsonDocumentUrl: '/iv/docs/json',
    })

    console.log('💎 [IV] Swagger UI: http://localhost:8000/iv/docs')
    console.log(`📊 [IV] API 개수: ${Object.keys(filteredIvDocument.paths).length}개`)

    // ========================================
    // WEDDING (결혼식 아카이브) API 문서
    // ========================================
    const weddingConfig = new DocumentBuilder()
      .setTitle('Wedding Archive API')
      .setDescription('멀티테넌트 모바일 청첩장 서비스 — 사진/영상 업로드 & 공유')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Wedding 인증', '이메일/비밀번호 JWT 인증')
      .addTag('Wedding 커플', '청첩장 커플 관리')
      .addTag('Wedding 미디어', '사진/영상 업로드 및 검수')
      .addTag('Wedding 참석 응답', 'RSVP 제출 및 집계')
      .addTag('Wedding 콘텐츠 행', '청첩장 콘텐츠 행 관리')
      .build()

    const weddingDocument = SwaggerModule.createDocument(app, weddingConfig, { include: [] })

    const filteredWeddingDocument = {
      ...weddingDocument,
      paths: Object.fromEntries(Object.entries(weddingDocument.paths).filter(([path]) => path.startsWith('/api/wedding/'))),
    }

    SwaggerModule.setup('wedding/docs', app, filteredWeddingDocument, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
      customSiteTitle: 'Wedding API - 청첩장 아카이브',
      jsonDocumentUrl: '/wedding/docs/json',
    })

    console.log('💎 [Wedding] Swagger UI: http://localhost:8000/wedding/docs')
    console.log(`📊 [Wedding] API 개수: ${Object.keys(filteredWeddingDocument.paths).length}개`)
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
