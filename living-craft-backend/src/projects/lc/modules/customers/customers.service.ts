import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Customer } from './entities';
import { LoginDto, RefreshTokenDto } from './dto/request';
import {
  LoginResponseDto,
  RefreshResponseDto,
  CustomerProfileDto,
} from './dto/response';
import { ICustomerJwtPayload } from './interfaces';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * UUID로 고객 조회
   */
  async findByUuid(uuid: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { uuid },
    });
  }

  /**
   * ID로 고객 조회
   */
  async findById(id: number): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { id },
    });
  }

  /**
   * 토스 사용자 ID로 고객 조회
   */
  async findByTossUserId(tossUserId: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { tossUserId },
    });
  }

  /**
   * 개발 환경용 고객 조회
   * 환경 변수 DEV_CUSTOMER_ID가 있으면 해당 고객 조회,
   * 없으면 toss_user_id가 있는 첫 번째 고객 조회
   */
  async findDevCustomer(): Promise<Customer | null> {
    const devCustomerId = this.configService.get<number>('DEV_CUSTOMER_ID');

    if (devCustomerId) {
      return this.findById(devCustomerId);
    }

    // toss_user_id가 있는 첫 번째 고객 조회
    return this.customerRepository.findOne({
      where: { tossUserId: Not(IsNull()) },
      order: { id: 'ASC' },
    });
  }

  /**
   * 토스 appLogin - Mock 처리
   * 실제 토스 연동 시 이 메서드만 수정하면 됨
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    // Mock: authorizationCode를 기반으로 더미 사용자 생성/조회
    // 실제 구현 시: 토스 API로 accessToken 발급 -> 사용자 정보 조회
    const mockTossUserId = `toss_${dto.authorizationCode.substring(0, 10)}`;

    // 기존 고객 조회
    let customer = await this.findByTossUserId(mockTossUserId);

    // 신규 고객 생성
    if (!customer) {
      customer = this.customerRepository.create({
        tossUserId: mockTossUserId,
        name: `토스사용자_${Date.now().toString().slice(-4)}`,
        phone: `010-0000-${Date.now().toString().slice(-4)}`,
      });
      customer = await this.customerRepository.save(customer);
    }

    // JWT 토큰 발급
    const tokens = await this.generateTokens(customer);

    // Refresh Token 저장
    await this.updateRefreshToken(customer.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        createdAt: customer.createdAt.toISOString(),
      },
    };
  }

  /**
   * 토큰 갱신
   */
  async refresh(dto: RefreshTokenDto): Promise<RefreshResponseDto> {
    try {
      // Refresh Token 검증
      const payload = this.jwtService.verify<ICustomerJwtPayload>(
        dto.refreshToken,
        {
          secret: this.configService.get<string>('jwt.secret'),
        },
      );

      if (payload.type !== 'customer') {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
      }

      // 고객 조회
      const customer = await this.findByUuid(payload.sub);

      if (!customer) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHORIZED_USER);
      }

      // 저장된 Refresh Token과 비교
      if (customer.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException(
          ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
        );
      }

      // 새 토큰 발급
      const tokens = await this.generateTokens(customer);

      // 새 Refresh Token 저장
      await this.updateRefreshToken(customer.id, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.TOKEN_REFRESH_FAILED);
    }
  }

  /**
   * 로그아웃
   */
  async logout(customerId: number): Promise<void> {
    await this.customerRepository.update(customerId, {
      refreshToken: null,
    });
  }

  /**
   * 내 정보 조회
   */
  async getProfile(customerId: number): Promise<CustomerProfileDto> {
    const customer = await this.findById(customerId);

    if (!customer) {
      throw new BadRequestException(ERROR_MESSAGES.CUSTOMER.NOT_FOUND);
    }

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      createdAt: customer.createdAt.toISOString(),
    };
  }

  /**
   * JWT 토큰 생성
   */
  private async generateTokens(
    customer: Customer,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: ICustomerJwtPayload = {
      sub: customer.uuid,
      name: customer.name,
      phone: customer.phone,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn') || '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: '7d', // Refresh Token은 7일
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh Token 업데이트
   */
  private async updateRefreshToken(
    customerId: number,
    refreshToken: string,
  ): Promise<void> {
    await this.customerRepository.update(customerId, {
      refreshToken,
    });
  }
}
