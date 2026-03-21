import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Film, CuttingProject, CuttingPiece } from './entities';
import {
  CreateFilmDto,
  UpdateFilmDto,
  CreateCuttingProjectDto,
  UpdateCuttingProjectDto,
  AddPiecesDto,
  UpdatePieceDto,
} from './dto/request';
import {
  FilmListItemDto,
  FilmDetailDto,
  CuttingProjectListItemDto,
  CuttingProjectDetailDto,
  CuttingPieceResponseDto,
} from './dto/response';

@Injectable()
export class FilmOptimizerService {
  constructor(
    @InjectRepository(Film)
    private readonly filmRepository: Repository<Film>,
    @InjectRepository(CuttingProject)
    private readonly projectRepository: Repository<CuttingProject>,
    @InjectRepository(CuttingPiece)
    private readonly pieceRepository: Repository<CuttingPiece>,
  ) {}

  // ==================== Film (필름지) ====================

  /**
   * 필름지 목록 조회
   */
  async findAllFilms(): Promise<FilmListItemDto[]> {
    const films = await this.filmRepository.find({
      relations: ['cuttingProjects'],
      order: { createdAt: 'DESC' },
    });

    return films.map((film) => this.toFilmListItemDto(film));
  }

  /**
   * 필름지 상세 조회
   */
  async findFilmById(id: number): Promise<FilmDetailDto> {
    const film = await this.filmRepository.findOne({
      where: { id },
      relations: ['cuttingProjects'],
    });

    if (!film) {
      throw new NotFoundException('필름지를 찾을 수 없습니다.');
    }

    return this.toFilmDetailDto(film);
  }

  /**
   * 필름지 생성
   */
  async createFilm(dto: CreateFilmDto): Promise<FilmDetailDto> {
    const film = this.filmRepository.create(dto);
    const savedFilm = await this.filmRepository.save(film);
    return this.toFilmDetailDto(savedFilm);
  }

  /**
   * 필름지 수정
   */
  async updateFilm(id: number, dto: UpdateFilmDto): Promise<FilmDetailDto> {
    const film = await this.filmRepository.findOne({
      where: { id },
      relations: ['cuttingProjects'],
    });

    if (!film) {
      throw new NotFoundException('필름지를 찾을 수 없습니다.');
    }

    Object.assign(film, dto);
    const updatedFilm = await this.filmRepository.save(film);
    return this.toFilmDetailDto(updatedFilm);
  }

  /**
   * 필름지 삭제
   */
  async deleteFilm(id: number): Promise<void> {
    const film = await this.filmRepository.findOne({
      where: { id },
      relations: ['cuttingProjects'],
    });

    if (!film) {
      throw new NotFoundException('필름지를 찾을 수 없습니다.');
    }

    if (film.cuttingProjects && film.cuttingProjects.length > 0) {
      throw new BadRequestException(
        '해당 필름지에 연결된 재단 프로젝트가 있어 삭제할 수 없습니다.',
      );
    }

    await this.filmRepository.remove(film);
  }

  // ==================== CuttingProject (재단 프로젝트) ====================

  /**
   * 재단 프로젝트 목록 조회
   */
  async findAllProjects(filmId?: number): Promise<CuttingProjectListItemDto[]> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.film', 'film')
      .leftJoinAndSelect('project.pieces', 'pieces')
      .orderBy('project.createdAt', 'DESC');

    if (filmId) {
      queryBuilder.where('project.filmId = :filmId', { filmId });
    }

    const projects = await queryBuilder.getMany();
    return projects.map((project) => this.toProjectListItemDto(project));
  }

  /**
   * 재단 프로젝트 상세 조회
   */
  async findProjectById(id: number): Promise<CuttingProjectDetailDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['film', 'pieces'],
      order: { pieces: { sortOrder: 'ASC', id: 'ASC' } },
    });

    if (!project) {
      throw new NotFoundException('재단 프로젝트를 찾을 수 없습니다.');
    }

    return this.toProjectDetailDto(project);
  }

  /**
   * 재단 프로젝트 생성
   */
  async createProject(
    dto: CreateCuttingProjectDto,
  ): Promise<CuttingProjectDetailDto> {
    // 필름지 존재 확인
    const film = await this.filmRepository.findOne({
      where: { id: dto.filmId },
    });

    if (!film) {
      throw new NotFoundException('필름지를 찾을 수 없습니다.');
    }

    // 프로젝트 생성
    const project = this.projectRepository.create({
      name: dto.name,
      filmId: dto.filmId,
      allowRotation: dto.allowRotation ?? true,
    });

    const savedProject = await this.projectRepository.save(project);

    // 조각이 있으면 추가
    if (dto.pieces && dto.pieces.length > 0) {
      const pieces = dto.pieces.map((piece, index) =>
        this.pieceRepository.create({
          projectId: savedProject.id,
          width: piece.width,
          height: piece.height,
          quantity: piece.quantity ?? 1,
          label: piece.label,
          sortOrder: index,
          isCompleted: piece.isCompleted ?? false,
          fixedPosition: piece.fixedPosition ?? null,
        }),
      );
      await this.pieceRepository.save(pieces);
    }

    return this.findProjectById(savedProject.id);
  }

  /**
   * 재단 프로젝트 수정
   */
  async updateProject(
    id: number,
    dto: UpdateCuttingProjectDto,
  ): Promise<CuttingProjectDetailDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('재단 프로젝트를 찾을 수 없습니다.');
    }

    // 필름지 변경 시 존재 확인
    if (dto.filmId && dto.filmId !== project.filmId) {
      const film = await this.filmRepository.findOne({
        where: { id: dto.filmId },
      });
      if (!film) {
        throw new NotFoundException('필름지를 찾을 수 없습니다.');
      }
    }

    Object.assign(project, dto);
    await this.projectRepository.save(project);

    return this.findProjectById(id);
  }

  /**
   * 재단 프로젝트 삭제
   */
  async deleteProject(id: number): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('재단 프로젝트를 찾을 수 없습니다.');
    }

    await this.projectRepository.remove(project);
  }

  // ==================== CuttingPiece (재단 조각) ====================

  /**
   * 재단 조각 일괄 추가
   */
  async addPieces(
    projectId: number,
    dto: AddPiecesDto,
  ): Promise<CuttingProjectDetailDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['pieces'],
    });

    if (!project) {
      throw new NotFoundException('재단 프로젝트를 찾을 수 없습니다.');
    }

    // 현재 최대 sortOrder 찾기
    const maxSortOrder =
      project.pieces.length > 0
        ? Math.max(...project.pieces.map((p) => p.sortOrder))
        : -1;

    // 조각 추가
    const pieces = dto.pieces.map((piece, index) =>
      this.pieceRepository.create({
        projectId,
        width: piece.width,
        height: piece.height,
        quantity: piece.quantity ?? 1,
        label: piece.label,
        sortOrder: maxSortOrder + 1 + index,
        isCompleted: piece.isCompleted ?? false,
        fixedPosition: piece.fixedPosition ?? null,
      }),
    );

    await this.pieceRepository.save(pieces);

    return this.findProjectById(projectId);
  }

  /**
   * 재단 조각 수정
   */
  async updatePiece(
    projectId: number,
    pieceId: number,
    dto: UpdatePieceDto,
  ): Promise<CuttingPieceResponseDto> {
    const piece = await this.pieceRepository.findOne({
      where: { id: pieceId, projectId },
    });

    if (!piece) {
      throw new NotFoundException('재단 조각을 찾을 수 없습니다.');
    }

    Object.assign(piece, dto);
    const updatedPiece = await this.pieceRepository.save(piece);

    return this.toPieceResponseDto(updatedPiece);
  }

  /**
   * 재단 조각 삭제
   */
  async deletePiece(projectId: number, pieceId: number): Promise<void> {
    const piece = await this.pieceRepository.findOne({
      where: { id: pieceId, projectId },
    });

    if (!piece) {
      throw new NotFoundException('재단 조각을 찾을 수 없습니다.');
    }

    await this.pieceRepository.remove(piece);
  }

  /**
   * 재단 완료 토글
   * @param projectId 프로젝트 ID
   * @param pieceId 조각 ID
   * @param fixedPosition 완료 시 고정 위치 (선택적)
   */
  async togglePieceComplete(
    projectId: number,
    pieceId: number,
    fixedPosition?: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotated: boolean;
    },
  ): Promise<CuttingPieceResponseDto> {
    const piece = await this.pieceRepository.findOne({
      where: { id: pieceId, projectId },
    });

    if (!piece) {
      throw new NotFoundException('재단 조각을 찾을 수 없습니다.');
    }

    piece.isCompleted = !piece.isCompleted;

    // 완료로 전환 시 fixedPosition 저장, 미완료로 전환 시 null로 초기화
    if (piece.isCompleted && fixedPosition) {
      piece.fixedPosition = fixedPosition;
    } else if (!piece.isCompleted) {
      piece.fixedPosition = null;
    }

    const updatedPiece = await this.pieceRepository.save(piece);

    return this.toPieceResponseDto(updatedPiece);
  }

  // ==================== DTO 변환 헬퍼 ====================

  private toFilmListItemDto(film: Film): FilmListItemDto {
    return {
      id: film.id,
      name: film.name,
      width: film.width,
      length: film.length,
      description: film.description,
      isActive: film.isActive,
      projectCount: film.cuttingProjects?.length ?? 0,
      createdAt: film.createdAt,
    };
  }

  private toFilmDetailDto(film: Film): FilmDetailDto {
    return {
      ...this.toFilmListItemDto(film),
      updatedAt: film.updatedAt,
    };
  }

  private toProjectListItemDto(
    project: CuttingProject,
  ): CuttingProjectListItemDto {
    const pieces = project.pieces ?? [];
    return {
      id: project.id,
      name: project.name,
      filmId: project.filmId,
      filmName: project.film?.name ?? '',
      filmWidth: project.film?.width ?? 0,
      filmLength: project.film?.length ?? 0,
      allowRotation: project.allowRotation,
      wastePercentage: project.wastePercentage,
      usedLength: project.usedLength,
      pieceCount: pieces.length,
      completedPieceCount: pieces.filter((p) => p.isCompleted).length,
      createdAt: project.createdAt,
    };
  }

  private toProjectDetailDto(project: CuttingProject): CuttingProjectDetailDto {
    return {
      id: project.id,
      name: project.name,
      film: {
        id: project.film.id,
        name: project.film.name,
        width: project.film.width,
        length: project.film.length,
      },
      allowRotation: project.allowRotation,
      wastePercentage: project.wastePercentage,
      usedLength: project.usedLength,
      packingResult: project.packingResult,
      pieces: (project.pieces ?? []).map((piece) =>
        this.toPieceResponseDto(piece),
      ),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toPieceResponseDto(piece: CuttingPiece): CuttingPieceResponseDto {
    return {
      id: piece.id,
      width: piece.width,
      height: piece.height,
      quantity: piece.quantity,
      label: piece.label,
      sortOrder: piece.sortOrder,
      isCompleted: piece.isCompleted,
      fixedPosition: piece.fixedPosition ?? null,
      createdAt: piece.createdAt,
    };
  }
}
