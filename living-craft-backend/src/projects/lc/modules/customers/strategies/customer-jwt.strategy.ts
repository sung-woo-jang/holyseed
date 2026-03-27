import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ICustomerJwtPayload } from '../interfaces';
import { CustomersService } from '../customers.service';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(
  Strategy,
  'customer-jwt',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly customersService: CustomersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: ICustomerJwtPayload) {
    // 토큰 타입 확인
    if (payload.type !== 'customer') {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }

    // payload에서 고객 UUID 추출하여 조회
    const customer = await this.customersService.findByUuid(payload.sub);

    if (!customer) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHORIZED_USER);
    }

    // request.user에 저장될 데이터
    return {
      id: customer.id,
      uuid: customer.uuid,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    };
  }
}
