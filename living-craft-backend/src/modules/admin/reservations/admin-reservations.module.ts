import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '@modules/reservations/entities';
import { AdminReservationsController } from './admin-reservations.controller';
import { AdminReservationsService } from './admin-reservations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  controllers: [AdminReservationsController],
  providers: [AdminReservationsService],
  exports: [AdminReservationsService],
})
export class AdminReservationsModule {}
