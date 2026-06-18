import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeddingAuthController } from './auth.controller';
import { WeddingAuthService } from './auth.service';
import { WeddingUser } from './entities/wedding-user.entity';
import { Couple } from '../couples/entities/couple.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeddingUser, Couple])],
  controllers: [WeddingAuthController],
  providers: [WeddingAuthService],
  exports: [WeddingAuthService],
})
export class WeddingAuthModule {}
