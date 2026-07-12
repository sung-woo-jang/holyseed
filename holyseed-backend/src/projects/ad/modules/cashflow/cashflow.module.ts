import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { CashflowService } from './cashflow.service';
import { CashflowController } from './cashflow.controller';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Membership])],
  controllers: [CashflowController],
  providers: [CashflowService, MembershipGuard],
})
export class CashflowModule {}
