import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingRecord } from './entities';
import { SavingService } from './saving.service';
import { SavingController } from './saving.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SavingRecord])],
  controllers: [SavingController],
  providers: [SavingService],
})
export class SavingModule {}
