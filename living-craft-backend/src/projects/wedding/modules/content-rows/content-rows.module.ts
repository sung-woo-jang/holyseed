import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentRowsController } from './content-rows.controller';
import { ContentRowsService } from './content-rows.service';
import { WeddingContentRow } from './entities/wedding-content-row.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeddingContentRow])],
  controllers: [ContentRowsController],
  providers: [ContentRowsService],
  exports: [ContentRowsService],
})
export class ContentRowsModule {}
