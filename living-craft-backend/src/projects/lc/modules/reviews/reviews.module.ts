import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Reservation } from '@lc/modules/reservations/entities';
import { FilesModule } from '@shared/files/files.module';
import { CustomersModule } from '@lc/modules/customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Reservation]),
    FilesModule,
    CustomersModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
