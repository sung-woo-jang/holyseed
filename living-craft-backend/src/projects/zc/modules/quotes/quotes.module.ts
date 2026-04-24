import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, QuoteItem])],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
