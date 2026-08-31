import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestbookController } from './guestbook.controller';
import { GuestbookService } from './guestbook.service';
import { WeddingGuestbook } from './entities/wedding-guestbook.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeddingGuestbook])],
  controllers: [GuestbookController],
  providers: [GuestbookService],
  exports: [GuestbookService],
})
export class GuestbookModule {}
