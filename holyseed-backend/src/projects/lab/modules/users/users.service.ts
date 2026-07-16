import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabUser } from './entities/lab-user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(LabUser)
    private readonly userRepo: Repository<LabUser>,
  ) {}

  async findById(id: number): Promise<LabUser> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }
}
