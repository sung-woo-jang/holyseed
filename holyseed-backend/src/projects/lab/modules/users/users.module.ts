import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabUser } from './entities/lab-user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([LabUser])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class LabUsersModule {}
