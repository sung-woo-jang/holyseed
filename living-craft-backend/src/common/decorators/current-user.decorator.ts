import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IJwtPayload } from '@common/interfaces';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
