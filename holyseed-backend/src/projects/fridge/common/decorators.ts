import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FridgeRequest } from './household.guard';

export const HouseholdId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number => ctx.switchToHttp().getRequest<FridgeRequest>().householdId,
);

export const HouseholdRole = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<FridgeRequest>().householdRole,
);

export const FridgeUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number => Number(ctx.switchToHttp().getRequest<FridgeRequest>().user.userId),
);
