import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JipUser } from './entities/jip-user.entity';
import { JipLoginDto } from './dto/request/login.dto';

@Injectable()
export class JipAuthService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(JipUser)
    private readonly userRepo: Repository<JipUser>,
  ) {}

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count > 0) return;

    const username = this.configService.get<string>('JIP_BOOTSTRAP_USERNAME') || 'admin';
    const rawPassword =
      this.configService.get<string>('JIP_BOOTSTRAP_PASSWORD') || crypto.randomBytes(8).toString('hex');

    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const user = this.userRepo.create({ username, passwordHash, displayName: '김장인' });
    await this.userRepo.save(user);

    console.log(`\n🔐 [JIP] 초기 계정 생성됨`);
    console.log(`   username: ${username}`);
    if (!this.configService.get<string>('JIP_BOOTSTRAP_PASSWORD')) {
      console.log(`   password: ${rawPassword} (⚠️  .env에 JIP_BOOTSTRAP_PASSWORD 설정 권장)`);
    }
    console.log('');
  }

  async login(dto: JipLoginDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('사용자명 또는 비밀번호가 올바르지 않습니다.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('사용자명 또는 비밀번호가 올바르지 않습니다.');

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const secret = this.configService.get<string>('jwt.secret');
    const token = this.jwtService.sign({ sub: String(user.id), scope: 'jip', role: 'admin' }, { secret, expiresIn: '7d' });

    return {
      accessToken: token,
      user: { id: user.id, username: user.username, displayName: user.displayName },
    };
  }

  async validateToken(token: string): Promise<{ userId: number; role: string } | null> {
    try {
      const secret = this.configService.get<string>('jwt.secret');
      const payload = this.jwtService.verify(token, { secret });
      if (payload.scope !== 'jip') return null;
      return { userId: Number(payload.sub), role: payload.role };
    } catch {
      return null;
    }
  }
}
