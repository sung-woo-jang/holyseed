import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdUser } from './entities/ad-user.entity';
import { UpdateUserDto } from './dto/request/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(AdUser)
    private readonly userRepo: Repository<AdUser>,
  ) {}

  async findById(id: number): Promise<AdUser> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<AdUser> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }
}
