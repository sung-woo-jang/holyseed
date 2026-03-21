import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Film, CuttingProject, CuttingPiece } from './entities';
import { FilmOptimizerService } from './film-optimizer.service';
import { FilmOptimizerController } from './film-optimizer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Film, CuttingProject, CuttingPiece])],
  controllers: [FilmOptimizerController],
  providers: [FilmOptimizerService],
  exports: [FilmOptimizerService],
})
export class FilmOptimizerModule {}
