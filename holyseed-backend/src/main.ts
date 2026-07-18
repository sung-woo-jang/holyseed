import { join } from 'path';
import { CustomValidationPipe } from '@common/pipes';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

// Explicitly load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 8000);
  const environment = configService.get<string>('app.environment');

  // CORS 설정
  const corsOrigins = process.env.CORS_ORIGINS || '';
  const allowedOrigins = corsOrigins ? corsOrigins.split(',').map((origin) => origin.trim()) : [];

  console.log('🌍 CORS_ORIGINS:', process.env.CORS_ORIGINS);
  console.log('🌍 Allowed Origins:', allowedOrigins);
  console.log('🌍 Environment:', environment);

  app.enableCors({
    origin: true, // 임시로 모든 Origin 허용
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/'],
  });

  // Global pipes - 한국어 에러 메시지를 제공하는 커스텀 ValidationPipe
  app.useGlobalPipes(new CustomValidationPipe());

  // 정적 파일 서빙 (업로드된 파일)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

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
      .addTag('AD 인증', '이메일·소셜 로그인 인증')
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
      .build();

    const adDocument = SwaggerModule.createDocument(app, adConfig, {
      include: [],
    });

    const filteredAdDocument = {
      ...adDocument,
      paths: Object.fromEntries(Object.entries(adDocument.paths).filter(([path]) => path.startsWith('/api/ad/'))),
    };

    SwaggerModule.setup('ad/docs', app, filteredAdDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'AD API - 자산일기',
      jsonDocumentUrl: '/ad/docs/json',
    });

    console.log('💎 [AD] Swagger UI: http://localhost:8000/ad/docs');
    console.log('💎 [AD] Swagger JSON: http://localhost:8000/ad/docs/json');
    console.log(`📊 [AD] API 개수: ${Object.keys(filteredAdDocument.paths).length}개`);

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
      .build();

    const weddingDocument = SwaggerModule.createDocument(app, weddingConfig, { include: [] });

    const filteredWeddingDocument = {
      ...weddingDocument,
      paths: Object.fromEntries(
        Object.entries(weddingDocument.paths).filter(([path]) => path.startsWith('/api/wedding/')),
      ),
    };

    SwaggerModule.setup('wedding/docs', app, filteredWeddingDocument, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
      customSiteTitle: 'Wedding API - 청첩장 아카이브',
      jsonDocumentUrl: '/wedding/docs/json',
    });

    console.log('💎 [Wedding] Swagger UI: http://localhost:8000/wedding/docs');
    console.log(`📊 [Wedding] API 개수: ${Object.keys(filteredWeddingDocument.paths).length}개`);

    // ========================================
    // LAB (개인 다목적 대시보드) API 문서
    // ========================================
    const labConfig = new DocumentBuilder()
      .setTitle('Lab API')
      .setDescription('개인 다목적 대시보드 — 무한매수법·VR·근무일지·일정·저축·필름 재단')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Lab 인증', '이메일/비밀번호 JWT 인증')
      .addTag('Lab 사용자', '사용자 프로필 관리')
      .addTag('Lab 필름 재단', '인테리어 필름 재단 최적화')
      .addTag('Lab VR', 'TQQQ 밸류 리밸런싱 상태·체결·사이클')
      .addTag('Lab 근무일지', '근무 기록·급여 계산·월별 집계')
      .addTag('Lab 일정', '캘린더 일정 관리')
      .addTag('Lab 저축', '1억 저축 플래너')
      .build();

    const labDocument = SwaggerModule.createDocument(app, labConfig, { include: [] });

    const filteredLabDocument = {
      ...labDocument,
      paths: Object.fromEntries(Object.entries(labDocument.paths).filter(([path]) => path.startsWith('/api/lab/'))),
    };

    SwaggerModule.setup('lab/docs', app, filteredLabDocument, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
      customSiteTitle: 'Lab API - 개인 대시보드',
      jsonDocumentUrl: '/lab/docs/json',
    });

    console.log('💎 [Lab] Swagger UI: http://localhost:8000/lab/docs');
    console.log(`📊 [Lab] API 개수: ${Object.keys(filteredLabDocument.paths).length}개`);
  }

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});
