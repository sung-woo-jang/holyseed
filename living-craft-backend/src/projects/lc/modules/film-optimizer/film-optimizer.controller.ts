import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FilmOptimizerService } from './film-optimizer.service';
import {
  CreateFilmDto,
  UpdateFilmDto,
  CreateCuttingProjectDto,
  UpdateCuttingProjectDto,
  AddPiecesDto,
  UpdatePieceDto,
  TogglePieceCompleteDto,
} from './dto/request';
import {
  FilmListItemDto,
  FilmDetailDto,
  CuttingProjectListItemDto,
  CuttingProjectDetailDto,
  CuttingPieceResponseDto,
} from './dto/response';
import { SuccessResponseDto } from '@common/dto/response/success-response.dto';

@Controller('admin/film-optimizer')
@ApiTags('필름 재단 최적화 (관리자)')
@ApiBearerAuth()
export class FilmOptimizerController {
  constructor(private readonly filmOptimizerService: FilmOptimizerService) {}

  // ==================== Film (필름지) ====================

  @Get('films')
  @ApiOperation({ summary: '필름지 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '필름지 목록 조회 성공',
    type: [FilmListItemDto],
  })
  async getFilms(): Promise<SuccessResponseDto<FilmListItemDto[]>> {
    const films = await this.filmOptimizerService.findAllFilms();
    return new SuccessResponseDto('필름지 목록 조회에 성공했습니다.', films);
  }

  @Get('films/:id')
  @ApiOperation({ summary: '필름지 상세 조회' })
  @ApiParam({ name: 'id', description: '필름지 ID' })
  @ApiResponse({
    status: 200,
    description: '필름지 상세 조회 성공',
    type: FilmDetailDto,
  })
  @ApiResponse({ status: 404, description: '필름지를 찾을 수 없음' })
  async getFilm(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<FilmDetailDto>> {
    const film = await this.filmOptimizerService.findFilmById(id);
    return new SuccessResponseDto('필름지 상세 조회에 성공했습니다.', film);
  }

  @Post('films')
  @ApiOperation({ summary: '필름지 생성' })
  @ApiResponse({
    status: 201,
    description: '필름지 생성 성공',
    type: FilmDetailDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  async createFilm(
    @Body() dto: CreateFilmDto,
  ): Promise<SuccessResponseDto<FilmDetailDto>> {
    const film = await this.filmOptimizerService.createFilm(dto);
    return new SuccessResponseDto('필름지가 생성되었습니다.', film);
  }

  @Post('films/:id/update')
  @ApiOperation({ summary: '필름지 수정' })
  @ApiParam({ name: 'id', description: '필름지 ID' })
  @ApiResponse({
    status: 200,
    description: '필름지 수정 성공',
    type: FilmDetailDto,
  })
  @ApiResponse({ status: 404, description: '필름지를 찾을 수 없음' })
  async updateFilm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFilmDto,
  ): Promise<SuccessResponseDto<FilmDetailDto>> {
    const film = await this.filmOptimizerService.updateFilm(id, dto);
    return new SuccessResponseDto('필름지가 수정되었습니다.', film);
  }

  @Post('films/:id/delete')
  @ApiOperation({ summary: '필름지 삭제' })
  @ApiParam({ name: 'id', description: '필름지 ID' })
  @ApiResponse({ status: 200, description: '필름지 삭제 성공' })
  @ApiResponse({ status: 404, description: '필름지를 찾을 수 없음' })
  @ApiResponse({
    status: 400,
    description: '연결된 프로젝트가 있어 삭제 불가',
  })
  async deleteFilm(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<null>> {
    await this.filmOptimizerService.deleteFilm(id);
    return new SuccessResponseDto('필름지가 삭제되었습니다.', null);
  }

  // ==================== CuttingProject (재단 프로젝트) ====================

  @Get('projects')
  @ApiOperation({ summary: '재단 프로젝트 목록 조회' })
  @ApiQuery({
    name: 'filmId',
    required: false,
    description: '필름지 ID로 필터링',
  })
  @ApiResponse({
    status: 200,
    description: '재단 프로젝트 목록 조회 성공',
    type: [CuttingProjectListItemDto],
  })
  async getProjects(
    @Query('filmId') filmId?: string,
  ): Promise<SuccessResponseDto<CuttingProjectListItemDto[]>> {
    const parsedFilmId = filmId ? parseInt(filmId, 10) : undefined;
    const projects =
      await this.filmOptimizerService.findAllProjects(parsedFilmId);
    return new SuccessResponseDto(
      '재단 프로젝트 목록 조회에 성공했습니다.',
      projects,
    );
  }

  @Get('projects/:id')
  @ApiOperation({ summary: '재단 프로젝트 상세 조회' })
  @ApiParam({ name: 'id', description: '프로젝트 ID' })
  @ApiResponse({
    status: 200,
    description: '재단 프로젝트 상세 조회 성공',
    type: CuttingProjectDetailDto,
  })
  @ApiResponse({ status: 404, description: '재단 프로젝트를 찾을 수 없음' })
  async getProject(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<CuttingProjectDetailDto>> {
    const project = await this.filmOptimizerService.findProjectById(id);
    return new SuccessResponseDto(
      '재단 프로젝트 상세 조회에 성공했습니다.',
      project,
    );
  }

  @Post('projects')
  @ApiOperation({ summary: '재단 프로젝트 생성' })
  @ApiResponse({
    status: 201,
    description: '재단 프로젝트 생성 성공',
    type: CuttingProjectDetailDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 404, description: '필름지를 찾을 수 없음' })
  async createProject(
    @Body() dto: CreateCuttingProjectDto,
  ): Promise<SuccessResponseDto<CuttingProjectDetailDto>> {
    const project = await this.filmOptimizerService.createProject(dto);
    return new SuccessResponseDto('재단 프로젝트가 생성되었습니다.', project);
  }

  @Post('projects/:id/update')
  @ApiOperation({ summary: '재단 프로젝트 수정' })
  @ApiParam({ name: 'id', description: '프로젝트 ID' })
  @ApiResponse({
    status: 200,
    description: '재단 프로젝트 수정 성공',
    type: CuttingProjectDetailDto,
  })
  @ApiResponse({ status: 404, description: '재단 프로젝트를 찾을 수 없음' })
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCuttingProjectDto,
  ): Promise<SuccessResponseDto<CuttingProjectDetailDto>> {
    const project = await this.filmOptimizerService.updateProject(id, dto);
    return new SuccessResponseDto('재단 프로젝트가 수정되었습니다.', project);
  }

  @Post('projects/:id/delete')
  @ApiOperation({ summary: '재단 프로젝트 삭제' })
  @ApiParam({ name: 'id', description: '프로젝트 ID' })
  @ApiResponse({ status: 200, description: '재단 프로젝트 삭제 성공' })
  @ApiResponse({ status: 404, description: '재단 프로젝트를 찾을 수 없음' })
  async deleteProject(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<null>> {
    await this.filmOptimizerService.deleteProject(id);
    return new SuccessResponseDto('재단 프로젝트가 삭제되었습니다.', null);
  }

  // ==================== CuttingPiece (재단 조각) ====================

  @Post('projects/:projectId/pieces')
  @ApiOperation({ summary: '재단 조각 일괄 추가' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiResponse({
    status: 200,
    description: '재단 조각 추가 성공',
    type: CuttingProjectDetailDto,
  })
  @ApiResponse({ status: 404, description: '재단 프로젝트를 찾을 수 없음' })
  async addPieces(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: AddPiecesDto,
  ): Promise<SuccessResponseDto<CuttingProjectDetailDto>> {
    const project = await this.filmOptimizerService.addPieces(projectId, dto);
    return new SuccessResponseDto('재단 조각이 추가되었습니다.', project);
  }

  @Post('projects/:projectId/pieces/:pieceId/update')
  @ApiOperation({ summary: '재단 조각 수정' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiParam({ name: 'pieceId', description: '조각 ID' })
  @ApiResponse({
    status: 200,
    description: '재단 조각 수정 성공',
    type: CuttingPieceResponseDto,
  })
  @ApiResponse({ status: 404, description: '재단 조각을 찾을 수 없음' })
  async updatePiece(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
    @Body() dto: UpdatePieceDto,
  ): Promise<SuccessResponseDto<CuttingPieceResponseDto>> {
    const piece = await this.filmOptimizerService.updatePiece(
      projectId,
      pieceId,
      dto,
    );
    return new SuccessResponseDto('재단 조각이 수정되었습니다.', piece);
  }

  @Post('projects/:projectId/pieces/:pieceId/delete')
  @ApiOperation({ summary: '재단 조각 삭제' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiParam({ name: 'pieceId', description: '조각 ID' })
  @ApiResponse({ status: 200, description: '재단 조각 삭제 성공' })
  @ApiResponse({ status: 404, description: '재단 조각을 찾을 수 없음' })
  async deletePiece(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
  ): Promise<SuccessResponseDto<null>> {
    await this.filmOptimizerService.deletePiece(projectId, pieceId);
    return new SuccessResponseDto('재단 조각이 삭제되었습니다.', null);
  }

  @Post('projects/:projectId/pieces/:pieceId/toggle-complete')
  @ApiOperation({ summary: '재단 완료 토글' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiParam({ name: 'pieceId', description: '조각 ID' })
  @ApiResponse({
    status: 200,
    description: '재단 완료 상태 변경 성공',
    type: CuttingPieceResponseDto,
  })
  @ApiResponse({ status: 404, description: '재단 조각을 찾을 수 없음' })
  async togglePieceComplete(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
    @Body() dto: TogglePieceCompleteDto,
  ): Promise<SuccessResponseDto<CuttingPieceResponseDto>> {
    const piece = await this.filmOptimizerService.togglePieceComplete(
      projectId,
      pieceId,
      dto.fixedPosition,
    );
    return new SuccessResponseDto('재단 완료 상태가 변경되었습니다.', piece);
  }
}
