import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdUser } from './entities/ad-user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdUser])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class AdUsersModule {}
