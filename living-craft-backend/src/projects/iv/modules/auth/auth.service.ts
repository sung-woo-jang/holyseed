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

  async register(username: string, password: string): Promise<{ token: string; user: Omit<IvUser, 'passwordHash'> }> {
    const existing = await this.userRepo.findOne({ where: { username } })
    if (existing) throw new ConflictException('이미 사용 중인 아이디입니다.')

    const passwordHash = await bcrypt.hash(password, 10)
    const user = this.userRepo.create({ username, passwordHash })
    const saved = await this.userRepo.save(user)

    const token = this.jwtService.sign({ sub: saved.id, username: saved.username })
    const { passwordHash: _, ...userInfo } = saved
    return { token, user: userInfo }
  }

  async login(username: string, password: string): Promise<{ token: string; user: Omit<IvUser, 'passwordHash'> }> {
    const user = await this.userRepo.findOne({ where: { username } })
    if (!user) throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.')

    const token = this.jwtService.sign({ sub: user.id, username: user.username })
    const { passwordHash: _, ...userInfo } = user
    return { token, user: userInfo }
  }

  async me(userId: string): Promise<Omit<IvUser, 'passwordHash'>> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다.')
    const { passwordHash: _, ...userInfo } = user
    return userInfo
  }

  async updateNickname(userId: string, nickname: string): Promise<Omit<IvUser, 'passwordHash'>> {
    await this.userRepo.update(userId, { nickname })
    return this.me(userId)
  }
}
