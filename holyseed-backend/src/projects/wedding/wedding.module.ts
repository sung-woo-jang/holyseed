import { Module } from '@nestjs/common';
import { WeddingAuthModule } from './modules/auth/auth.module';
import { CouplesModule } from './modules/couples/couples.module';
import { MediaModule } from './modules/media/media.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ContentRowsModule } from './modules/content-rows/content-rows.module';
import { GuestbookModule } from './modules/guestbook/guestbook.module';

@Module({
  imports: [WeddingAuthModule, CouplesModule, MediaModule, AttendanceModule, ContentRowsModule, GuestbookModule],
})
export class WeddingModule {}
