import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { join } from 'path';
import { existsSync } from 'fs';
import { FileUtil } from '@common/utils/file.util';
import { ERROR_MESSAGES } from '@common/constants';
import { NcpStorageService } from '@common/services/ncp-storage.service';
import sharp from 'sharp';

@Injectable()
export class FilesService {
  private readonly uploadPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly ncpStorageService: NcpStorageService,
  ) {
    this.uploadPath = this.configService.get<string>(
      'app.uploadPath',
      './uploads',
    );
    // NCP Object Storage 사용으로 로컬 디렉토리 생성 불필요
    // this.ensureUploadDirectories();
  }

  /**
   * Multer 설정 반환
   * 메모리 스토리지 사용 (file.buffer 제공)
   */
  getMulterOptions(): MulterOptions {
    return {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

        if (FileUtil.isAllowedFileType(file.originalname, allowedTypes)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(ERROR_MESSAGES.FILES.UNSUPPORTED_TYPE),
            false,
          );
        }
      },
      limits: {
        fileSize: this.configService.get<number>(
          'app.maxFileSize',
          10 * 1024 * 1024,
        ), // 10MB
      },
    };
  }

  /**
   * 이미지 업로드 및 리사이징 (NCP Object Storage)
   * 모바일 앱 최적화: WebP 포맷, 적응형 품질, 메타데이터 제거
   */
  async uploadImage(
    file: Express.Multer.File,
    subfolder = 'images',
    maxWidth = 800, // 모바일 최적화: 800px (대부분의 디바이스에 충분)
    quality = 82, // WebP 최적 품질
  ): Promise<{ filename: string; path: string; url: string }> {
    if (!FileUtil.isImageFile(file.originalname)) {
      throw new BadRequestException(ERROR_MESSAGES.FILES.IMAGE_ONLY);
    }

    // WebP 확장자로 변경
    const baseFilename = FileUtil.generateUniqueFilename(file.originalname);
    const filename = baseFilename.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    const s3Key = `${subfolder}/${filename}`;

    try {
      // 파일 버퍼 확인
      if (!file.buffer) {
        console.error('파일 버퍼가 없습니다:', {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
        });
        throw new Error('파일 버퍼가 없습니다. 메모리 스토리지를 사용해주세요.');
      }

      console.log('이미지 처리 시작:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        bufferLength: file.buffer?.length,
      });

      // 원본 이미지 메타데이터 분석
      const metadata = await sharp(file.buffer).metadata();
      const originalWidth = metadata.width || 0;

      // 적응형 품질 설정 (큰 이미지는 품질 낮춤)
      let adaptiveQuality = quality;
      if (originalWidth > 1500) {
        adaptiveQuality = Math.max(75, quality - 7); // 큰 이미지는 품질 7 낮춤
      } else if (originalWidth > 1000) {
        adaptiveQuality = Math.max(78, quality - 4); // 중간 이미지는 품질 4 낮춤
      }

      // Sharp를 사용한 이미지 최적화
      const processedBuffer = await sharp(file.buffer)
        // 리사이징
        .resize(maxWidth, null, {
          withoutEnlargement: true, // 원본보다 크게 만들지 않음
          fit: 'inside', // 비율 유지하며 내부에 맞춤
          kernel: sharp.kernel.lanczos3, // 고품질 리샘플링
        })
        // 색상 공간 최적화
        .toColorspace('srgb')
        // 샤프닝 적용 (리사이징 시 선명도 유지)
        .sharpen({
          sigma: 0.5, // 가벼운 샤프닝
        })
        // WebP 포맷으로 변환 (JPEG/PNG 대비 25-34% 작은 파일 크기)
        .webp({
          quality: adaptiveQuality,
          effort: 4, // 압축 노력도 (0-6, 4는 품질과 속도의 균형)
          smartSubsample: true, // 스마트 서브샘플링
        })
        // 메타데이터 제거 (EXIF, ICC 프로필 등)
        .withMetadata({
          orientation: metadata.orientation, // 회전 정보만 유지
        })
        .toBuffer();

      // 압축률 로깅
      const originalSize = file.size;
      const optimizedSize = processedBuffer.length;
      const compressionRatio = (
        ((originalSize - optimizedSize) / originalSize) *
        100
      ).toFixed(1);

      console.log(
        `이미지 최적화: ${file.originalname} | ` +
          `원본: ${(originalSize / 1024).toFixed(1)}KB → ` +
          `최적화: ${(optimizedSize / 1024).toFixed(1)}KB | ` +
          `압축률: ${compressionRatio}% | ` +
          `품질: ${adaptiveQuality}`,
      );

      // NCP Object Storage에 업로드
      const url = await this.ncpStorageService.uploadFile(
        processedBuffer,
        s3Key,
        'image/webp',
      );

      return {
        filename,
        path: s3Key,
        url,
      };
    } catch (error) {
      console.error('이미지 처리 실패:', {
        error: error.message,
        stack: error.stack,
        file: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          hasBuffer: !!file.buffer,
          bufferLength: file.buffer?.length,
        },
      });
      throw new BadRequestException(
        ERROR_MESSAGES.FILES.IMAGE_PROCESSING_ERROR,
      );
    }
  }

  /**
   * 파일 삭제 (NCP Object Storage)
   */
  async deleteFile(s3Key: string): Promise<void> {
    await this.ncpStorageService.deleteFile(s3Key);
  }

  /**
   * 파일 URL에서 S3 Key 추출
   * NCP URL: https://kr.object.ncloudstorage.com/living-craft/images/filename.jpg
   * -> S3 Key: images/filename.jpg
   */
  getFilePathFromUrl(url: string): string {
    const bucketName = this.configService.get<string>('app.ncp.bucketName');

    // 로컬 URL 형식인 경우 (하위 호환성)
    if (url.startsWith('/uploads/')) {
      return url.replace('/uploads/', '');
    }

    // NCP URL에서 S3 Key 추출
    try {
      const urlObj = new URL(url);
      const pathWithBucket = urlObj.pathname.substring(1); // 맨 앞 '/' 제거
      return pathWithBucket.replace(`${bucketName}/`, '');
    } catch (error) {
      console.error('URL 파싱 실패:', error);
      // URL 파싱 실패 시 그대로 반환
      return url;
    }
  }

  /**
   * 파일 존재 여부 확인
   */
  fileExists(filepath: string): boolean {
    return existsSync(filepath);
  }

  /**
   * 문서 파일 업로드 (NCP Object Storage, 리사이징 없이 원본 그대로 저장)
   */
  async uploadDocument(
    file: Express.Multer.File,
  ): Promise<{ filename: string; path: string; url: string }> {
    const allowedDocTypes = ['.pdf', '.doc', '.docx', '.hwp', '.txt'];
    const extension = FileUtil.getExtension(file.originalname);

    if (!allowedDocTypes.includes(extension.toLowerCase())) {
      throw new BadRequestException(
        ERROR_MESSAGES.FILES.UNSUPPORTED_DOCUMENT_TYPE,
      );
    }

    const filename = FileUtil.generateUniqueFilename(file.originalname);
    const s3Key = `documents/${filename}`;

    try {
      // 문서 파일은 리사이징 없이 원본 그대로 NCP에 업로드
      const url = await this.ncpStorageService.uploadFile(
        file.buffer,
        s3Key,
        file.mimetype,
      );

      return {
        filename,
        path: s3Key,
        url,
      };
    } catch (error) {
      throw new BadRequestException(
        ERROR_MESSAGES.FILES.DOCUMENT_SAVE_ERROR(error.message),
      );
    }
  }

  /**
   * 파일 정보 반환
   */
  getFileInfo(file: Express.Multer.File): {
    originalName: string;
    size: string;
    mimeType: string;
    extension: string;
  } {
    return {
      originalName: file.originalname,
      size: FileUtil.formatFileSize(file.size),
      mimeType: file.mimetype,
      extension: FileUtil.getExtension(file.originalname),
    };
  }

  /**
   * 임시 파일 정리 (스케줄러에서 사용)
   */
  async cleanupTempFiles(): Promise<void> {
    const tempDir = join(this.uploadPath, 'temp');
    console.log('Cleaning up temp files in:', tempDir);
    // 실제 구현에서는 fs.readdir과 stat을 사용하여 파일 생성일 확인 후 삭제
  }

  /**
   * 업로드 디렉토리 생성
   */
  private ensureUploadDirectories(): void {
    const directories = [
      'images',
      'services',
      'portfolio',
      'reviews',
      'documents',
      'temp',
    ];

    directories.forEach((dir) => {
      const dirPath = join(this.uploadPath, dir);
      FileUtil.ensureDirectoryExists(dirPath);
    });
  }
}
