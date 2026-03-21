import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { SuccessResponseDto } from '@common/dto/response';
import { CustomersService } from './customers.service';
import { LoginDto, RefreshTokenDto } from './dto/request';
import {
  LoginResponseDto,
  RefreshResponseDto,
  CustomerProfileDto,
} from './dto/response';
import { CustomerJwtAuthGuard } from './guards';
import { CurrentCustomer, ICurrentCustomer } from './decorators';

@Controller('')
@ApiTags('고객 인증')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('auth/login')
  @Public()
  @ApiOperation({ summary: '토스 로그인 (appLogin)' })
  @ApiResponse({
    status: 201,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<SuccessResponseDto<LoginResponseDto>> {
    const result = await this.customersService.login(dto);
    return new SuccessResponseDto('로그인에 성공했습니다.', result);
  }

  @Post('auth/refresh')
  @Public()
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({
    status: 201,
    description: '토큰 갱신 성공',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: '유효하지 않은 토큰' })
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<SuccessResponseDto<RefreshResponseDto>> {
    const result = await this.customersService.refresh(dto);
    return new SuccessResponseDto('토큰이 갱신되었습니다.', result);
  }

  @Post('auth/logout')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 201, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async logout(
    @CurrentCustomer() customer: ICurrentCustomer,
  ): Promise<SuccessResponseDto<null>> {
    await this.customersService.logout(customer.id);
    return new SuccessResponseDto('로그아웃되었습니다.', null);
  }

  @Get('users/me')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: CustomerProfileDto,
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async getProfile(
    @CurrentCustomer() customer: ICurrentCustomer,
  ): Promise<SuccessResponseDto<CustomerProfileDto>> {
    const result = await this.customersService.getProfile(customer.id);
    return new SuccessResponseDto('내 정보 조회에 성공했습니다.', result);
  }
}
