import { homedir } from 'os';
import { join } from 'path';
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 8000,
  environment: process.env.NODE_ENV || 'development',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:8000',
  // ad-native(RN 앱) OTA 업데이트 번들 저장 경로 — 배포 시 git clean으로 지워지지 않도록 레포 밖(홈 디렉토리)을 기본값으로 둠
  adNativeUpdatesDir: process.env.AD_NATIVE_UPDATES_DIR || join(homedir(), 'ad-native-updates'),

  // NCP Object Storage
  ncp: {
    region: process.env.NCP_REGION || 'kr-standard',
    endpoint: process.env.NCP_ENDPOINT || 'https://kr.object.ncloudstorage.com',
    accessKey: process.env.NCP_ACCESS_KEY,
    secretKey: process.env.NCP_SECRET_KEY,
    bucketName: process.env.NCP_BUCKET_NAME || 'holyseed',
  },
}));
