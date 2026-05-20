import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PcUser } from './entities/pc-user.entity';
import { PcLoginDto } from './dto/request/login.dto';

@Injectable()
export class PcAuthService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(PcUser)
    private readonly userRepo: Repository<PcUser>,
  ) {}

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count > 0) return;

    const username = this.configService.get<string>('PC_BOOTSTRAP_USERNAME') || 'admin';
    const rawPassword = this.configService.get<string>('PC_BOOTSTRAP_PASSWORD') || crypto.randomBytes(8).toString('hex');

    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const user = this.userRepo.create({ username, passwordHash, displayName: '관리자' });
    await this.userRepo.save(user);

    console.log(`\n🔐 [PC] 초기 계정 생성됨`);
    console.log(`   username: ${username}`);
    if (!this.configService.get<string>('PC_BOOTSTRAP_PASSWORD')) {
      console.log(`   password: ${rawPassword} (⚠️  .env에 PC_BOOTSTRAP_PASSWORD 설정 권장)`);
    }
    console.log('');
  }

  async login(dto: PcLoginDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('사용자명 또는 비밀번호가 올바르지 않습니다.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('사용자명 또는 비밀번호가 올바르지 않습니다.');

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const secret = this.configService.get<string>('jwt.secret');
    const token = this.jwtService.sign(
      { sub: user.id, scope: 'pc' },
      { secret, expiresIn: '7d' },
    );

    return {
      accessToken: token,
      user: { id: user.id, username: user.username, displayName: user.displayName },
    };
  }
}
