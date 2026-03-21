import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Service,
  ServiceRegion,
  ServiceSchedule,
  ServiceHoliday,
} from './entities';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { District } from '@modules/admin/districts/entities/district.entity';
import { Icon } from '@modules/icons/entities/icon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ServiceRegion,
      ServiceSchedule,
      ServiceHoliday,
      District,
      Icon,
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
