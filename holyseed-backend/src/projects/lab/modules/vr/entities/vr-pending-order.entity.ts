import { Column, Entity, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

/**
 * 엔진이 접수한 주문 원장 (laofus LaofusPendingOrder와 동일 목적).
 * VR은 정수 수량 주문만 쓰므로 requestQuantity 하나만 사용 — laofus의
 * requestAmount(금액)/requestQuantity(수량) 이원화가 필요 없다.
 */
@Entity('vr_pending_orders', { schema: 'lab' })
export class VrPendingOrder extends BaseEntity {
  @ApiProperty({ description: '토스 주문 ID' })
  @Index({ unique: true })
  @Column({ name: 'order_id', length: 80 })
  orderId: string;

  @ApiProperty({ description: '멱등키 (clientOrderId)' })
  @Column({ name: 'client_order_id', length: 60 })
  clientOrderId: string;

  @ApiProperty({ description: '종목', example: 'TQQQ' })
  @Column({ length: 12 })
  symbol: string;

  @ApiProperty({ description: '매수/매도', example: 'BUY' })
  @Column({ length: 4 })
  side: string; // BUY | SELL

  @ApiProperty({ description: '주문 수량 (정수)', example: 3 })
  @Column({ name: 'request_quantity', type: 'int' })
  requestQuantity: number;

  @ApiProperty({ description: '사이클 번호', example: 1 })
  @Column({ name: 'cycle_no', type: 'int' })
  cycleNo: number;

  @ApiProperty({ description: 'PENDING(회수 대기) | APPLIED(반영 완료) | FAILED(취소/거부)', example: 'PENDING' })
  @Index()
  @Column({ length: 10, default: 'PENDING' })
  status: string;

  @ApiPropertyOptional({ description: '반영된 VrFill ID' })
  @Column({ name: 'applied_fill_id', type: 'int', nullable: true })
  appliedFillId: number | null;
}
