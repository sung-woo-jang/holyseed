import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Icon } from '@lc/modules/icons/entities/icon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Icon])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
