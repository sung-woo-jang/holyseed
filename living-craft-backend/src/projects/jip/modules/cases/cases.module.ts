import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';
import { CaseTag } from './entities/case-tag.entity';
import { CasePhoto } from './entities/case-photo.entity';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Case, CaseTag, CasePhoto])],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
