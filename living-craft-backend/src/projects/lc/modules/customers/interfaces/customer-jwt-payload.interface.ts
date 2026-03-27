export interface ICustomerJwtPayload {
  sub: string; // customer uuid
  name: string;
  phone: string;
  type: 'customer'; // 토큰 타입 구분
  iat?: number;
  exp?: number;
}
