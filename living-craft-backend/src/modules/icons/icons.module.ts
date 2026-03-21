import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Icon } from './entities/icon.entity';
import { IconsController } from './icons.controller';
import { IconsService } from './icons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Icon])],
  controllers: [IconsController],
  providers: [IconsService],
  exports: [IconsService],
})
export class IconsModule {}
