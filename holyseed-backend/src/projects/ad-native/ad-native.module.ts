import { Module } from '@nestjs/common';
import { UpdatesModule } from './modules/updates/updates.module';

@Module({
  imports: [UpdatesModule],
})
export class AdNativeModule {}
