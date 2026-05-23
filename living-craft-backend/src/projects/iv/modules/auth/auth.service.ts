import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { IvUser } from '../../entities/iv-user.entity'

@Injectable()
export class IvAuthService {
  constructor(
    @InjectRepository(IvUser)
    private readonly userRepo: Repository<IvUser>,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string): Promise<{ token: string; user: Omit<IvUser, 'passwordHash'> }> {
    const existing = await this.userRepo.findOne({ where: { email } })
    if (existing) throw new ConflictException('이미 사용 중인 이메일입니다.')

    const passwordHash = await bcrypt.hash(password, 10)
    const user = this.userRepo.create({ email, passwordHash, name })
    const saved = await this.userRepo.save(user)

    const token = this.jwtService.sign({ sub: saved.id, email: saved.email })
    const { passwordHash: _, ...userInfo } = saved
    return { token, user: userInfo }
  }

  async login(email: string, password: string): Promise<{ token: string; user: Omit<IvUser, 'passwordHash'> }> {
    const user = await this.userRepo.findOne({ where: { email } })
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')

    const token = this.jwtService.sign({ sub: user.id, email: user.email })
    const { passwordHash: _, ...userInfo } = user
    return { token, user: userInfo }
  }

  async me(userId: string): Promise<Omit<IvUser, 'passwordHash'>> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다.')
    const { passwordHash: _, ...userInfo } = user
    return userInfo
  }
}
