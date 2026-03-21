import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import {
  UsersQueryDto,
  UpdateUserDto,
  CreateUserDto,
} from '@modules/admin/users/dto';
import { ERROR_MESSAGES } from '@common/constants';
import { UserRole } from '@common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  // 사용자 생성
  async createUser(dto: CreateUserDto): Promise<User> {
    // 중복 체크 (이메일, 사용자명)
    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_ALREADY_EXISTS);
      }
      if (existingUser.username === dto.username) {
        throw new ConflictException(
          ERROR_MESSAGES.USER.USERNAME_ALREADY_EXISTS,
        );
      }
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 사용자 생성
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  // 사용자 목록 조회 (페이지네이션, 필터링, 검색)
  async findUsers(query: UsersQueryDto) {
    const { page, limit, skip, search, role, status, sortBy, sortOrder } =
      query;

    const where: FindOptionsWhere<User> = {};

    // 상태 필터
    if (status) {
      where.status = status;
    }

    // 역할 필터
    if (role) {
      where.role = role;
    }

    // 검색 (이름, 이메일, 사용자명)
    let searchConditions = [];
    if (search) {
      searchConditions = [
        { ...where, firstName: Like(`%${search}%`) },
        { ...where, lastName: Like(`%${search}%`) },
        { ...where, email: Like(`%${search}%`) },
        { ...where, username: Like(`%${search}%`) },
      ];
    }

    const [users, totalItems] = await this.userRepository.findAndCount({
      where: search ? searchConditions : where,
      skip,
      take: limit,
      order: {
        [sortBy || 'createdAt']: sortOrder || 'DESC',
      },
    });

    return {
      data: users,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // ID로 사용자 조회
  async findUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return user;
  }

  // UUID로 사용자 조회
  async findUserByUuid(uuid: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { uuid },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return user;
  }

  // 이메일로 사용자 조회 (인증용)
  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'uuid', 'email', 'password', 'role', 'status'],
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return user;
  }

  // 사용자 수정
  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(id);

    // 중복 체크 (이메일, 사용자명)
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_ALREADY_EXISTS);
      }
    }

    if (dto.username && dto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUsername) {
        throw new ConflictException(
          ERROR_MESSAGES.USER.USERNAME_ALREADY_EXISTS,
        );
      }
    }

    // 비밀번호 해시화
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    // 사용자 업데이트
    Object.assign(user, dto);
    return await this.userRepository.save(user);
  }

  // 사용자 삭제
  async deleteUser(id: number): Promise<void> {
    const user = await this.findUserById(id);
    await this.userRepository.remove(user);
  }

  // 마지막 로그인 시간 업데이트
  async updateLastLogin(id: number): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * 개발 환경용 사용자 조회
   * JwtAuthGuard에서 개발 환경 우회 시 사용
   */
  async findDevUser(): Promise<User | null> {
    const devUserId = this.configService.get<number>('DEV_USER_ID');

    if (devUserId) {
      return this.findUserById(devUserId);
    }

    // SUPERADMIN 역할의 첫 번째 사용자 조회
    return this.userRepository.findOne({
      where: { role: UserRole.SUPERADMIN },
      order: { id: 'ASC' },
      select: ['id', 'uuid', 'email', 'role', 'status'],
    });
  }
}
