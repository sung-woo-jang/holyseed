import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 5000, maxRedirects: 3 }),
    ConfigModule,
  ],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
