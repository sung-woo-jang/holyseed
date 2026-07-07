import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { WeddingUser, WeddingUserRole } from './entities/wedding-user.entity';
import { Couple } from '../couples/entities/couple.entity';
import { WeddingRegisterDto } from './dto/request/register.dto';
import { WeddingLoginDto } from './dto/request/login.dto';

@Injectable()
export class WeddingAuthService {
  constructor(
    @InjectRepository(WeddingUser)
    private readonly userRepo: Repository<WeddingUser>,
    @InjectRepository(Couple)
    private readonly coupleRepo: Repository<Couple>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 커플+관리자 계정 트랜잭션 생성, JWT 발급
   */
  async register(dto: WeddingRegisterDto) {
    const [existingEmail, existingSlug] = await Promise.all([
      this.userRepo.findOne({ where: { email: dto.email } }),
      this.coupleRepo.findOne({ where: { slug: dto.slug } }),
    ]);

    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
    if (existingSlug) {
      throw new ConflictException('이미 사용 중인 slug입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.dataSource.transaction(async (manager) => {
      const couple = manager.create(Couple, {
        slug: dto.slug,
        groomName: dto.groomName,
        brideName: dto.brideName,
      });
      const savedCouple = await manager.save(Couple, couple);

      const user = manager.create(WeddingUser, {
        email: dto.email,
        passwordHash,
        role: WeddingUserRole.ADMIN,
        coupleId: savedCouple.id,
      });
      const savedUser = await manager.save(WeddingUser, user);

      const token = this._issueToken(savedUser);

      return {
        accessToken: token,
        user: this._serializeUser(savedUser),
        couple: { id: savedCouple.id, slug: savedCouple.slug },
      };
    });
  }

  /**
   * 이메일/비밀번호 로그인, JWT 발급
   */
  async login(dto: WeddingLoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['couple'],
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const token = this._issueToken(user);

    return {
      accessToken: token,
      user: this._serializeUser(user),
      couple: user.couple ? { id: user.couple.id, slug: user.couple.slug } : null,
    };
  }

  /**
   * 현재 사용자 정보 + couple 조회
   */
  async getMe(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['couple'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      ...this._serializeUser(user),
      couple: user.couple,
    };
  }

  private _issueToken(user: WeddingUser): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      coupleId: user.coupleId,
    });
  }

  private _serializeUser(user: WeddingUser) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      coupleId: user.coupleId,
    };
  }
}
