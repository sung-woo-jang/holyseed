import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@common/decorators';
import { CustomersService } from '../customers.service';

@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private customersService: CustomersService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. @Public() 데코레이터 체크
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. 개발 환경에서는 실제 DB 사용자 주입
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'development') {
      const request = context.switchToHttp().getRequest();

      try {
        // 개발용 고객 조회 (환경 변수 DEV_CUSTOMER_ID 또는 toss_user_id가 있는 첫 번째 고객)
        const customer = await this.customersService.findDevCustomer();

        if (!customer) {
          throw new InternalServerErrorException(
            '[DEV] 개발용 고객 데이터를 찾을 수 없습니다. ' +
              'DB에 toss_user_id가 있는 고객이 존재하는지 확인하거나, ' +
              '.env에 DEV_CUSTOMER_ID를 설정해주세요.',
          );
        }

        // 실제 고객 데이터 주입 (request.user)
        request.user = {
          id: customer.id,
          uuid: customer.uuid,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        };

        console.log(
          `[DEV] CustomerJwtAuthGuard bypassed - injecting real user: ${customer.name} (id: ${customer.id}, toss_user_id: ${customer.tossUserId || 'N/A'})`,
        );

        return true;
      } catch (error) {
        console.error('[DEV] CustomerJwtAuthGuard 오류:', error);
        throw error;
      }
    }

    // 3. 프로덕션 환경에서는 정상 JWT 검증
    return super.canActivate(context) as Promise<boolean>;
  }
}
