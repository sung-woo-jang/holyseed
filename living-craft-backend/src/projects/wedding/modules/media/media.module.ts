import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { WeddingMedia } from './entities/wedding-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeddingMedia])],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
