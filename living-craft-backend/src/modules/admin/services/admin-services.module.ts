import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Service,
  ServiceRegion,
  ServiceSchedule,
} from '@modules/services/entities';
import { District } from '@modules/admin/districts/entities';
import { Icon } from '@modules/icons/entities';
import { AdminServicesController } from './admin-services.controller';
import { AdminServicesService } from './admin-services.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ServiceRegion,
      ServiceSchedule,
      District,
      Icon,
    ]),
  ],
  controllers: [AdminServicesController],
  providers: [AdminServicesService],
  exports: [AdminServicesService],
})
export class AdminServicesModule {}
