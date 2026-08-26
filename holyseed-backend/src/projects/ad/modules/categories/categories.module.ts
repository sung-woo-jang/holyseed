import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '@shared/files/files.module';
import { Category } from './entities/category.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { RecurringTransaction } from '../recurring-transactions/entities/recurring-transaction.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Membership, Transaction, RecurringTransaction]), FilesModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, MembershipGuard],
  exports: [CategoriesService],
})
export class AdCategoriesModule {}
