import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '@shared/files/files.module';
import { Category } from './entities/category.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Membership]), FilesModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, MembershipGuard],
  exports: [CategoriesService],
})
export class AdCategoriesModule {}
