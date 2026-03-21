import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UsersQueryDto } from './dto/request/users-query.dto';
import { UserResponseDto } from './dto/response/user-response.dto';
import { SuccessResponseDto } from '@common/dto/response/success-response.dto';
import { PaginatedResponseDto } from '@common/dto/response/paginated-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';
import { plainToInstance } from 'class-transformer';

@ApiTags('관리자 > 사용자 관리')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({ status: 201, description: '사용자 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 409, description: '중복된 이메일 또는 사용자명' })
  async createUser(
    @Body() dto: CreateUserDto,
  ): Promise<SuccessResponseDto<UserResponseDto>> {
    const user = await this.usersService.createUser(dto);
    const userResponse = plainToInstance(UserResponseDto, user);
    return new SuccessResponseDto('사용자가 생성되었습니다.', userResponse);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '사용자 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findUsers(
    @Query() query: UsersQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { data, meta } = await this.usersService.findUsers(query);
    const usersResponse = plainToInstance(UserResponseDto, data);
    return new PaginatedResponseDto(
      usersResponse,
      meta.currentPage,
      meta.itemsPerPage,
      meta.totalItems,
      '사용자 목록을 조회했습니다.',
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '사용자 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async findUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<UserResponseDto>> {
    const user = await this.usersService.findUserById(id);
    const userResponse = plainToInstance(UserResponseDto, user);
    return new SuccessResponseDto('사용자 정보를 조회했습니다.', userResponse);
  }

  @Post(':id/update')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '사용자 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '중복된 이메일 또는 사용자명' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<SuccessResponseDto<UserResponseDto>> {
    const user = await this.usersService.updateUser(id, dto);
    const userResponse = plainToInstance(UserResponseDto, user);
    return new SuccessResponseDto(
      '사용자 정보가 수정되었습니다.',
      userResponse,
    );
  }

  @Post(':id/delete')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<void>> {
    await this.usersService.deleteUser(id);
    return new SuccessResponseDto('사용자가 삭제되었습니다.');
  }
}
