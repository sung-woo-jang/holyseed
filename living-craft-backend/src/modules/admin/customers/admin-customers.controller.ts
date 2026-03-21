import {
  Controller,
  Get,
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
import { SuccessResponseDto } from '@common/dto/response/success-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';
import { AdminCustomersService } from './admin-customers.service';
import { AdminCustomersQueryDto } from './dto/request';
import {
  AdminCustomerListResponseDto,
  AdminCustomerDetailDto,
} from './dto/response';

@Controller('admin/customers')
@ApiTags('관리자 > 고객 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class AdminCustomersController {
  constructor(private readonly adminCustomersService: AdminCustomersService) {}

  @Get()
  @ApiOperation({ summary: '고객 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: AdminCustomerListResponseDto,
  })
  async findAll(
    @Query() query: AdminCustomersQueryDto,
  ): Promise<SuccessResponseDto<AdminCustomerListResponseDto>> {
    const result = await this.adminCustomersService.findAll(query);
    return new SuccessResponseDto('고객 목록 조회에 성공했습니다.', result);
  }

  @Get(':id')
  @ApiOperation({ summary: '고객 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: AdminCustomerDetailDto,
  })
  @ApiResponse({ status: 404, description: '고객을 찾을 수 없음' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto<AdminCustomerDetailDto>> {
    const result = await this.adminCustomersService.findById(id);
    return new SuccessResponseDto('고객 상세 조회에 성공했습니다.', result);
  }
}
