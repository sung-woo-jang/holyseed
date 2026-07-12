import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Membership])],
  controllers: [CategoriesController],
  providers: [CategoriesService, MembershipGuard],
  exports: [CategoriesService],
})
export class AdCategoriesModule {}
