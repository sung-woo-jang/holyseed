import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LaofusAccountSnapshot } from '@/projects/laofus/entities/account-snapshot.entity';
import { VrFill, VrFillKind } from '../entities/vr-fill.entity';

export interface WealthHistoryPoint {
  date: string;
  tqqqValue: number;
  cumulativePrincipal: number;
}

const SYMBOL = 'TQQQ';

/** VR 누적 성과(평가금/투자원금 추이) 조립 — 별도 신규 데이터 수집 없이 기존 스냅샷/체결에서 파생. */
@Injectable()
export class VrPerformanceService {
  constructor(
    @InjectRepository(LaofusAccountSnapshot) private readonly snapshotRepo: Repository<LaofusAccountSnapshot>,
    @InjectRepository(VrFill) private readonly fillRepo: Repository<VrFill>,
  ) {}

  /** laofus.account_snapshots(전체 계좌, 종목별 holdings_json 포함)에서 TQQQ 몫만 뽑아 일별 평가금 계열을 만든다. */
  private async getTqqqValueSeries(): Promise<{ date: string; value: number }[]> {
    const snapshots = await this.snapshotRepo.find({ order: { date: 'ASC' } });
    return snapshots
      .map((s) => {
        const holding = s.holdingsJson?.find((h) => h.symbol === SYMBOL);
        return { date: s.date, value: holding?.marketValueUsd ?? 0 };
      })
      .filter((r) => r.value > 0);
  }

  /** INITIAL_BUY·DEPOSIT 체결 합 = 실제로 이 계좌에 투입한 누적 원금(별도 설정값 없이 체결 이력에서 그대로 산출). */
  private async getCumulativePrincipalSeries(): Promise<{ date: string; cumulative: number }[]> {
    const fills = await this.fillRepo.find({
      where: [{ kind: VrFillKind.INITIAL_BUY }, { kind: VrFillKind.DEPOSIT }],
      order: { fillDate: 'ASC', id: 'ASC' },
    });
    let running = 0;
    return fills.map((f) => {
      running += f.amount;
      return { date: f.fillDate, cumulative: Math.round(running * 100) / 100 };
    });
  }

  async getWealthHistory(): Promise<WealthHistoryPoint[]> {
    const [tqqqSeries, principalSeries] = await Promise.all([
      this.getTqqqValueSeries(),
      this.getCumulativePrincipalSeries(),
    ]);
    if (tqqqSeries.length === 0) return [];

    return tqqqSeries.map(({ date, value }) => {
      // 그 날짜 이전(또는 당일)까지 발생한 입금·초기매수 누적 중 가장 최근 값을 원금으로 사용
      let principal = 0;
      for (const p of principalSeries) {
        if (p.date > date) break;
        principal = p.cumulative;
      }
      return { date, tqqqValue: value, cumulativePrincipal: principal };
    });
  }
}
