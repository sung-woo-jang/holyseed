import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkLog } from './entities/work-log.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { WorkLogsService } from './work-logs.service';
import { WorkLogsController } from './work-logs.controller';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([WorkLog, Transaction, Membership])],
  controllers: [WorkLogsController],
  providers: [WorkLogsService, MembershipGuard],
  exports: [WorkLogsService],
})
export class WorkLogsModule {}
