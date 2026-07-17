import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VrSetting, VrCycle, VrFill } from './entities';
import { VrService } from './vr.service';
import { VrController } from './vr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VrSetting, VrCycle, VrFill])],
  controllers: [VrController],
  providers: [VrService],
})
export class VrModule {}
