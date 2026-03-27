import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ICurrentCustomer {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  email?: string;
}

export const CurrentCustomer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ICurrentCustomer => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
