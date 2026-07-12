import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { WeddingMedia, ModerationStatus, ProcessingStatus } from './entities/wedding-media.entity';
import { SearchMediaDto } from './dto/request/search-media.dto';
import { ModerateMediaDto } from './dto/request/moderate-media.dto';
import { WeddingUserRole } from '../auth/entities/wedding-user.entity';

@Injectable()
export class MediaService {
  private readonly uploadPath: string;
  private readonly publicBaseUrl: string;

  constructor(
    @InjectRepository(WeddingMedia)
    private readonly mediaRepo: Repository<WeddingMedia>,
    private readonly configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get<string>('app.uploadPath', './uploads');
    this.publicBaseUrl = this.configService.get<string>('app.publicBaseUrl', 'http://localhost:8000');
  }

  /**
   * 미디어 검색/목록 (공개)
   */
  async search(dto: SearchMediaDto) {
    const where: Partial<WeddingMedia> = { coupleId: dto.coupleId };
    if (dto.moderationStatus) {
      where.moderationStatus = dto.moderationStatus;
    }

    const [media, total] = await this.mediaRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: dto.limit ?? 24,
      skip: dto.offset ?? 0,
    });

    const [totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      this.mediaRepo.count({ where: { coupleId: dto.coupleId } }),
      this.mediaRepo.count({ where: { coupleId: dto.coupleId, moderationStatus: ModerationStatus.PENDING } }),
      this.mediaRepo.count({ where: { coupleId: dto.coupleId, moderationStatus: ModerationStatus.APPROVED } }),
      this.mediaRepo.count({ where: { coupleId: dto.coupleId, moderationStatus: ModerationStatus.REJECTED } }),
    ]);

    return {
      media: media.map(this._serialize),
      total,
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    };
  }

  /**
   * 미디어 업로드 — Sharp로 3종(original/resized/thumbnail) 동기 생성
   */
  async upload(
    file: Express.Multer.File,
    coupleId: string,
    uploaderName?: string,
    message?: string,
  ): Promise<WeddingMedia> {
    if (!file.buffer) {
      throw new BadRequestException('파일 버퍼가 없습니다.');
    }

    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
      throw new BadRequestException('이미지 또는 비디오 파일만 업로드 가능합니다.');
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = isImage ? 'webp' : file.originalname.split('.').pop();
    const baseKey = `wedding/${coupleId}/${timestamp}_${random}`;

    let localOriginalPath: string | undefined;
    let localResizedPath: string | undefined;
    let localThumbnailPath: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (isImage) {
      const metadata = await sharp(file.buffer).metadata();
      width = metadata.width;
      height = metadata.height;

      // 1. original (WebP, q90, full size)
      const originalBuffer = await sharp(file.buffer)
        .toColorspace('srgb')
        .webp({ quality: 90 })
        .withMetadata({ orientation: metadata.orientation })
        .toBuffer();

      // 2. resized (1200px wide, WebP q85)
      const resizedBuffer = await sharp(file.buffer)
        .resize(1200, null, { withoutEnlargement: true, fit: 'inside', kernel: sharp.kernel.lanczos3 })
        .toColorspace('srgb')
        .webp({ quality: 85 })
        .toBuffer();

      // 3. thumbnail (400×400 cover, WebP q80)
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
        .toColorspace('srgb')
        .webp({ quality: 80 })
        .toBuffer();

      localOriginalPath = join(this.uploadPath, `${baseKey}_original.webp`);
      localResizedPath = join(this.uploadPath, `${baseKey}_resized.webp`);
      localThumbnailPath = join(this.uploadPath, `${baseKey}_thumbnail.webp`);

      await fs.mkdir(dirname(localOriginalPath), { recursive: true });
      await Promise.all([
        fs.writeFile(localOriginalPath, originalBuffer),
        fs.writeFile(localResizedPath, resizedBuffer),
        fs.writeFile(localThumbnailPath, thumbnailBuffer),
      ]);
    } else {
      // 비디오: 원본만 저장, 썸네일 미구현
      localOriginalPath = join(this.uploadPath, `${baseKey}_original.${ext}`);
      await fs.mkdir(dirname(localOriginalPath), { recursive: true });
      await fs.writeFile(localOriginalPath, file.buffer);
    }

    // Admin 업로드면 자동 승인
    const isAdminUpload = uploaderName === 'Admin';
    const moderationStatus = isAdminUpload ? ModerationStatus.APPROVED : ModerationStatus.PENDING;

    const media = this.mediaRepo.create({
      coupleId,
      localOriginalPath,
      localResizedPath,
      localThumbnailPath,
      processingStatus: ProcessingStatus.COMPLETED,
      moderationStatus,
      uploaderName,
      message,
      fileType: file.mimetype,
      fileSize: file.size,
      width,
      height,
    });

    return this.mediaRepo.save(media);
  }

  /**
   * 파일 바이너리 스트리밍 (original/resized/thumbnail)
   */
  async getFilePath(
    id: string,
    type: 'original' | 'resized' | 'thumbnail',
  ): Promise<{ path: string; mimeType: string }> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('미디어를 찾을 수 없습니다.');
    }

    // resized/original은 APPROVED만
    if (type !== 'thumbnail' && media.moderationStatus !== ModerationStatus.APPROVED) {
      throw new ForbiddenException('승인된 미디어가 아닙니다.');
    }

    const pathMap = {
      original: media.localOriginalPath,
      resized: media.localResizedPath ?? media.localOriginalPath,
      thumbnail: media.localThumbnailPath ?? media.localResizedPath ?? media.localOriginalPath,
    };

    const filePath = pathMap[type];
    if (!filePath) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    const isVideo = media.fileType?.startsWith('video/');
    const mimeType = type === 'original' && isVideo ? media.fileType : 'image/webp';

    return { path: filePath, mimeType };
  }

  /**
   * 검수 상태 변경
   */
  async moderate(
    id: string,
    dto: ModerateMediaDto,
    user: { coupleId: string; role: string },
  ): Promise<WeddingMedia> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('미디어를 찾을 수 없습니다.');
    }

    this._checkAccess(media.coupleId, user);
    media.moderationStatus = dto.moderationStatus;
    return this.mediaRepo.save(media);
  }

  /**
   * 미디어 삭제 (로컬 파일 + DB)
   */
  async delete(id: string, user: { coupleId: string; role: string }): Promise<void> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('미디어를 찾을 수 없습니다.');
    }

    this._checkAccess(media.coupleId, user);

    // 로컬 파일 삭제 (best-effort)
    await Promise.allSettled([
      media.localOriginalPath ? fs.unlink(media.localOriginalPath) : Promise.resolve(),
      media.localResizedPath ? fs.unlink(media.localResizedPath) : Promise.resolve(),
      media.localThumbnailPath ? fs.unlink(media.localThumbnailPath) : Promise.resolve(),
    ]);

    await this.mediaRepo.remove(media);
  }

  private _checkAccess(coupleId: string, user: { coupleId: string; role: string }): void {
    if (user.role === WeddingUserRole.SUPER_ADMIN) return;
    if (user.coupleId !== coupleId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
  }

  private _serialize(media: WeddingMedia) {
    return {
      ...media,
      fileSize: Number(media.fileSize), // bigint → number
    };
  }
}
