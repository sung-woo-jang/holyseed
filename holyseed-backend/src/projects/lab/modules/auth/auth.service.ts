import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LabUser } from '../users/entities/lab-user.entity';
import { RegisterDto } from './dto/request/register.dto';
import { LoginDto } from './dto/request/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(LabUser)
    private readonly userRepo: Repository<LabUser>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const name = dto.name || dto.email.split('@')[0];

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      name,
      lastLoginAt: new Date(),
    });
    const saved = await this.userRepo.save(user);
    delete saved.passwordHash;

    return { ...this.issueTokens(saved), user: saved };
  }

  async emailLogin(dto: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);
    delete user.passwordHash;

    return { ...this.issueTokens(user), user };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다.');

      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('갱신 토큰이 유효하지 않습니다.');
    }
  }

  private issueTokens(user: LabUser) {
    const payload = { sub: user.id, email: user.email };
    const secret = this.configService.get('jwt.secret');

    return {
      accessToken: this.jwtService.sign(payload, { secret, expiresIn: '24h' }),
      refreshToken: this.jwtService.sign(payload, { secret, expiresIn: '30d' }),
    };
  }
}
