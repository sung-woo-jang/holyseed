import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { FilesService } from '@shared/files/files.service';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly filesService: FilesService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async upload(productId: number, file: Express.Multer.File, isPrimary = false, sortOrder = 0): Promise<ProductImage> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('제품을 찾을 수 없습니다.');

    const { filename, path: s3Key, url } = await this.filesService.uploadImage(file, 'jip/pc/products');

    return await this.dataSource.transaction(async (em) => {
      if (isPrimary) {
        await em.update(ProductImage, { productId }, { isPrimary: false });
      }

      const image = em.create(ProductImage, {
        productId,
        url,
        s3Key,
        isPrimary,
        sortOrder,
      });
      const saved = await em.save(image);

      if (isPrimary) {
        await em.update(Product, { id: productId }, { primaryImageUrl: url });
      } else if (!product.primaryImageUrl) {
        await em.update(Product, { id: productId }, { primaryImageUrl: url });
        await em.update(ProductImage, { id: saved.id }, { isPrimary: true });
        saved.isPrimary = true;
      }

      return saved;
    });
  }

  async setPrimary(imageId: number): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('이미지를 찾을 수 없습니다.');

    await this.dataSource.transaction(async (em) => {
      await em.update(ProductImage, { productId: image.productId }, { isPrimary: false });
      await em.update(ProductImage, { id: imageId }, { isPrimary: true });
      await em.update(Product, { id: image.productId }, { primaryImageUrl: image.url });
    });
  }

  async updateSortOrder(imageId: number, sortOrder: number): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('이미지를 찾을 수 없습니다.');
    await this.imageRepo.update(imageId, { sortOrder });
  }

  async delete(imageId: number): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('이미지를 찾을 수 없습니다.');

    await this.dataSource.transaction(async (em) => {
      await em.delete(ProductImage, { id: imageId });

      if (image.isPrimary) {
        const next = await em.findOne(ProductImage, {
          where: { productId: image.productId },
          order: { sortOrder: 'ASC' },
        });
        if (next) {
          await em.update(ProductImage, { id: next.id }, { isPrimary: true });
          await em.update(Product, { id: image.productId }, { primaryImageUrl: next.url });
        } else {
          await em.update(Product, { id: image.productId }, { primaryImageUrl: null });
        }
      }
    });

    try {
      if (image.s3Key) {
        await this.filesService.deleteFile(image.s3Key);
      }
    } catch (err) {
      console.error('[PC] 이미지 NCP 삭제 실패 (DB는 삭제됨):', image.s3Key, err.message);
    }
  }
}
