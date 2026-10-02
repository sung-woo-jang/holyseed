import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Membership, MemberRole } from '../memberships/entities/membership.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';

describe('TransactionsService 수정·삭제 권한', () => {
  let tx: Record<string, unknown>;
  let membership: { role: MemberRole } | null;
  let save: jest.Mock;
  let remove: jest.Mock;
  let service: TransactionsService;

  beforeEach(() => {
    tx = { id: 1, householdId: 10, date: '2026-10-01', amount: 1000, title: '점심', createdByUserId: 5 };
    membership = { role: MemberRole.EDITOR };
    save = jest.fn((v: unknown) => Promise.resolve(v));
    remove = jest.fn().mockResolvedValue(undefined);
    service = new TransactionsService(
      { findOne: jest.fn(() => Promise.resolve(tx)), save, remove } as unknown as Repository<Transaction>,
      { findOne: jest.fn(() => Promise.resolve(membership)) } as unknown as Repository<Membership>,
    );
  });

  it('수정 가능한 필드만 반영하고 householdId 같은 내부 필드는 무시한다', async () => {
    await service.update(1, { title: '저녁', amount: 2000, householdId: 99, createdByUserId: 7 } as never, 5);

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ title: '저녁', amount: 2000, householdId: 10, createdByUserId: 5 }),
    );
  });

  it('카테고리·고정비 분류를 null로 비울 수 있다', async () => {
    tx.categoryId = 3;
    tx.costType = 'FIXED';

    await service.update(1, { categoryId: null, costType: null } as never, 5);

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ categoryId: null, costType: null }));
  });

  it('가구 구성원이 아니면 거래가 없는 것처럼 응답한다', async () => {
    membership = null;

    await expect(service.update(1, { title: 'x' }, 5)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.delete(1, 5)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findOneFor(1, 5)).rejects.toBeInstanceOf(NotFoundException);
    expect(save).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('조회자(VIEWER)는 볼 수는 있지만 수정·삭제는 못 한다', async () => {
    membership = { role: MemberRole.VIEWER };

    await expect(service.findOneFor(1, 5)).resolves.toBe(tx);
    await expect(service.update(1, { title: 'x' }, 5)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.delete(1, 5)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('편집자는 수정·삭제할 수 있다', async () => {
    await service.update(1, { title: 'x' }, 5);
    await service.delete(1, 5);

    expect(save).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
