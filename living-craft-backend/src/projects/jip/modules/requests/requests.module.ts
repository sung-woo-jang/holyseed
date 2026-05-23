import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from './entities/quote-request.entity';
import { QuoteRequestItem } from './entities/quote-request-item.entity';
import { QuoteRequestPhoto } from './entities/quote-request-photo.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, QuoteRequestItem, QuoteRequestPhoto])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
