import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 8000,
  environment: process.env.NODE_ENV || 'development',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB

  // NCP Object Storage
  ncp: {
    region: process.env.NCP_REGION || 'kr-standard',
    endpoint: process.env.NCP_ENDPOINT || 'https://kr.object.ncloudstorage.com',
    accessKey: process.env.NCP_ACCESS_KEY,
    secretKey: process.env.NCP_SECRET_KEY,
    bucketName: process.env.NCP_BUCKET_NAME || 'living-craft',
  },
}));
