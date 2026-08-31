import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OgController } from './og.controller';
import { OgService } from './og.service';
import { Couple } from '../couples/entities/couple.entity';
import { WeddingMedia } from '../media/entities/wedding-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Couple, WeddingMedia])],
  controllers: [OgController],
  providers: [OgService],
})
export class OgModule {}
