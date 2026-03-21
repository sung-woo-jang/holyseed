import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '@modules/customers/entities';
import { Reservation } from '@modules/reservations/entities';
import { Review } from '@modules/reviews/entities';
import { AdminCustomersController } from './admin-customers.controller';
import { AdminCustomersService } from './admin-customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Reservation, Review])],
  controllers: [AdminCustomersController],
  providers: [AdminCustomersService],
  exports: [AdminCustomersService],
})
export class AdminCustomersModule {}
