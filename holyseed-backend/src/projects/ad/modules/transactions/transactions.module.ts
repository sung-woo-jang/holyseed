import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Membership])],
  controllers: [TransactionsController],
  providers: [TransactionsService, MembershipGuard],
  exports: [TransactionsService],
})
export class TransactionsModule {}
