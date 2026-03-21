import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './entities';
import { Icon } from '@modules/icons/entities/icon.entity';
import { PromotionsService } from './promotions.service';
import {
  PromotionsController,
  AdminPromotionsController,
} from './promotions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, Icon])],
  controllers: [PromotionsController, AdminPromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
