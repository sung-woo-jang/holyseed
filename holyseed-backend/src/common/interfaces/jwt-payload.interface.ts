import { UserRole } from '@common/enums';

export interface IJwtPayload {
  sub: string; // user uuid
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
