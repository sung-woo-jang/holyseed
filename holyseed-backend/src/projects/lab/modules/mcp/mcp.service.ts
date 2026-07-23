import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { LabUser } from '../users/entities/lab-user.entity';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * lab 대시보드 API를 MCP 도구로 노출 (VR/근무일지/일정/저축/필름재단).
 * 도구는 env LAB_MCP_USER_EMAIL 계정의 내부 JWT로 자기 REST API를 호출한다
 * — 가드·검증·계산 로직을 그대로 재사용.
 */
@Injectable()
export class McpService {
  private api: AxiosInstance | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(LabUser)
    private readonly userRepo: Repository<LabUser>,
  ) {}

  get secret(): string {
    return this.configService.get('LAB_MCP_SECRET') || '';
  }

  /** 지정 계정으로 내부 JWT 발급 + axios 클라이언트 (lazy) */
  private async getApi(): Promise<AxiosInstance> {
    if (this.api) return this.api;

    const email = (this.configService.get('LAB_MCP_USER_EMAIL') || '').toLowerCase();
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error(`MCP 계정(${email})을 찾을 수 없습니다. LAB_MCP_USER_EMAIL을 확인하세요.`);

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: this.configService.get('jwt.secret'), expiresIn: '365d' },
    );

    const port = this.configService.get('app.port', 8000);
    this.api = axios.create({
      baseURL: `http://127.0.0.1:${port}/api/lab`,
      timeout: 15000,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    return this.api;
  }

  private ok(payload: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] };
  }

  private fail(e: unknown) {
    const msg = (e as any)?.response?.data?.message ?? (e instanceof Error ? e.message : '요청에 실패했습니다.');
    return { content: [{ type: 'text' as const, text: `오류: ${msg}` }], isError: true };
  }

  private async call<T>(fn: (api: AxiosInstance) => Promise<T>) {
    try {
      const api = await this.getApi();
      const result = await fn(api);
      return this.ok(result);
    } catch (e) {
      return this.fail(e);
    }
  }

  private unwrap(res: { data: any }) {
    return res.data?.data ?? res.data;
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** 요청마다 새 McpServer 생성 (stateless) */
  createServer(): McpServer {
    const server = new McpServer({ name: 'lab', version: '1.0.0' });

    // zod 3.25 + strictNullChecks:false 조합에서 registerTool 제네릭 추론이
    // TS2589(무한 인스턴스화)로 터짐 → 타입 추론만 우회 (런타임 zod 검증은 유지)
    const registerTool = (name: string, config: unknown, handler: (args: any) => unknown) =>
      (server.registerTool as any)(name, config, handler);

    // ==================== VR ====================

    registerTool(
      'vr_get_state',
      {
        title: 'VR 상태 조회',
        description:
          'TQQQ 밸류 리밸런싱 현재 상태: V값, 최소/최대 밴드, Pool(현재·사용가능 75%), 보유수량, 평단(기록용), 현재 사이클, 다음 V 갱신일, V₂ 예정값. 매수/매도 판단: 평가금(보유수량×현재가) < 최소밴드 → 매수, > 최대밴드 → 매도, 그 외 홀딩.',
        inputSchema: {},
      },
      () => this.call(async (api) => this.unwrap(await api.get('/vr/state'))),
    );

    registerTool(
      'vr_get_ladder',
      {
        title: 'VR 계단식 예약 매수/매도표',
        description:
          '1주씩 순차 체결 가정의 예약표. 매수 트리거가 = 최소밴드 ÷ (매수 직전 보유수량), 매도 트리거가 = 최대밴드 ÷ (매도 직전 보유수량). Pool 누적 차감/가산과 75% 사용 한도 초과 여부 포함. 참조/시뮬레이션 용도 (실제 예약주문 아님).',
        inputSchema: { steps: z.number().optional().describe('행 수 (기본 15)') },
      },
      ({ steps }) =>
        this.call(async (api) => {
          const state = this.unwrap(await api.get('/vr/state'));
          const n = steps ?? 15;
          const buy: any[] = [];
          let poolLeft = state.pool;
          let used = 0;
          for (let i = 1; i <= n; i++) {
            const prevQty = state.quantity + i - 1;
            if (prevQty <= 0) break;
            const trigger = round2(state.minBand / prevQty);
            poolLeft = round2(poolLeft - trigger);
            used = round2(used + trigger);
            buy.push({
              체결후보유: prevQty + 1,
              트리거가: trigger,
              Pool잔액: poolLeft,
              한도초과: used > state.usablePool,
            });
          }
          const sell: any[] = [];
          let poolAfter = state.pool;
          for (let i = 1; i <= Math.min(n, state.quantity); i++) {
            const prevQty = state.quantity - i + 1;
            const trigger = round2(state.maxBand / prevQty);
            poolAfter = round2(poolAfter + trigger);
            sell.push({ 체결후보유: prevQty - 1, 트리거가: trigger, Pool잔액: poolAfter });
          }
          return {
            기준: {
              보유수량: state.quantity,
              최소밴드: state.minBand,
              최대밴드: state.maxBand,
              Pool: state.pool,
              사용가능Pool: state.usablePool,
            },
            매수표: buy,
            매도표: sell,
          };
        }),
    );

    registerTool(
      'vr_get_fills',
      {
        title: 'VR 체결 이력',
        description: '체결 이력 전체 (최신순). 각 행에 체결 후 Pool/보유수량/평단 스냅샷 포함.',
        inputSchema: {},
      },
      () => this.call(async (api) => this.unwrap(await api.get('/vr/fills'))),
    );

    registerTool(
      'vr_add_fill',
      {
        title: 'VR 체결 등록',
        description:
          '체결을 등록하면 Pool/보유수량/평단이 자동 계산됩니다. kind: BUY(매수)/SELL(매도)/DEPOSIT(적립금 입금, quantity=0·price=입금액)/INITIAL_BUY(초기매수).',
        inputSchema: {
          kind: z.enum(['BUY', 'SELL', 'DEPOSIT', 'INITIAL_BUY']).describe('체결 구분'),
          price: z.number().describe('체결가 $ (DEPOSIT은 입금액)'),
          quantity: z.number().int().describe('수량 (DEPOSIT은 0)'),
          fillDate: z.string().optional().describe('YYYY-MM-DD, 생략 시 오늘'),
          note: z.string().optional().describe('메모'),
        },
      },
      ({ kind, price, quantity, fillDate, note }) =>
        this.call(async (api) =>
          this.unwrap(await api.post('/vr/fills', { fillDate: fillDate ?? this.today(), kind, price, quantity, note })),
        ),
    );

    registerTool(
      'vr_delete_fill',
      {
        title: 'VR 체결 삭제',
        description: '체결을 삭제하고 전체 스냅샷(Pool/보유/평단)을 재계산합니다.',
        inputSchema: { fillId: z.number().describe('체결 id (vr_get_fills로 확인)') },
      },
      ({ fillId }) => this.call(async (api) => this.unwrap(await api.post(`/vr/fills/${fillId}/delete`))),
    );

    registerTool(
      'vr_rollover',
      {
        title: 'VR V 갱신 실행',
        description:
          'V 갱신일 처리: 현 사이클 종료 → V₂ = V₁ + Pool/G + 적립금 → 새 사이클 시작(적립금 DEPOSIT 자동 기록). 사이클 종료 다음 월요일에 실행하는 작업입니다. 실행 전 사용자에게 확인하세요.',
        inputSchema: {
          newStartDate: z.string().optional().describe('새 사이클 시작일 YYYY-MM-DD (생략 시 종료 다음 월요일)'),
        },
      },
      ({ newStartDate }) =>
        this.call(async (api) => this.unwrap(await api.post('/vr/cycles/rollover', { newStartDate }))),
    );

    // ==================== 근무일지 ====================

    registerTool(
      'worklog_month',
      {
        title: '근무일지 월별 조회',
        description:
          '해당 월의 근무 기록과 집계(근무일수/총액/실수령 합계/수령·미수령 분리)를 조회합니다. 실수령 = 금액 × 0.967 (원천징수 3.3%).',
        inputSchema: {
          year: z.number().describe('연도 (예: 2026)'),
          month: z.number().min(1).max(12).describe('월 (1~12)'),
        },
      },
      ({ year, month }) => this.call(async (api) => this.unwrap(await api.post('/worklog/search', { year, month }))),
    );

    registerTool(
      'worklog_add',
      {
        title: '근무 기록 추가',
        description:
          '근무 기록을 추가합니다. 금액은 서버가 공식(공수·초과수당·휴게 점심1시간 기본 차감)대로 자동 계산 — 실수령이 계산과 다르면 amountOverride로 실제 금액을 넣으세요(실수령 우선 원칙). 일급여는 날짜 기준 자동(현재 14만원). 휴무는 payStatus=DAYOFF.',
        inputSchema: {
          title: z.string().describe('현장명 (여러 곳이면 / 구분, 휴무면 "휴무")'),
          workDate: z.string().optional().describe('YYYY-MM-DD, 생략 시 오늘'),
          startTime: z.string().optional().describe('시작 HH:mm (예 08:00)'),
          endTime: z.string().optional().describe('종료 HH:mm'),
          breakHours: z.number().optional().describe('휴게시간 (기본 1)'),
          jobs: z.array(z.string()).optional().describe('업무: 도배/필름/퍼티/철거/페인트/세팅'),
          payStatus: z
            .enum(['RECEIVED', 'EXPECTED', 'UNPAID', 'DAYOFF'])
            .optional()
            .describe('수령여부 (기본 EXPECTED=예상(미수령))'),
          amountOverride: z.number().optional().describe('실수령액이 계산과 다를 때 수동 금액 (원)'),
          address: z.string().optional().describe('주소'),
          memo: z.string().optional().describe('특이사항'),
        },
      },
      (args) =>
        this.call(async (api) =>
          this.unwrap(await api.post('/worklog', { ...args, workDate: args.workDate ?? this.today() })),
        ),
    );

    registerTool(
      'worklog_update',
      {
        title: '근무 기록 수정',
        description: '기존 근무 기록 수정 (수령여부 변경 포함). 시간·일급 변경 시 금액 재계산.',
        inputSchema: {
          id: z.number().describe('기록 id (worklog_month로 확인)'),
          title: z.string().optional(),
          workDate: z.string().optional().describe('YYYY-MM-DD'),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          breakHours: z.number().optional(),
          jobs: z.array(z.string()).optional(),
          payStatus: z.enum(['RECEIVED', 'EXPECTED', 'UNPAID', 'DAYOFF']).optional(),
          amountOverride: z.number().nullable().optional().describe('null이면 오버라이드 해제'),
          address: z.string().optional(),
          memo: z.string().optional(),
        },
      },
      ({ id, ...rest }) => this.call(async (api) => this.unwrap(await api.post(`/worklog/${id}/update`, rest))),
    );

    registerTool(
      'worklog_delete',
      {
        title: '근무 기록 삭제',
        description: '근무 기록을 삭제합니다. 삭제 전 사용자에게 확인하세요.',
        inputSchema: { id: z.number().describe('기록 id') },
      },
      ({ id }) => this.call(async (api) => this.unwrap(await api.post(`/worklog/${id}/delete`))),
    );

    // ==================== 필름 재단 ====================

    registerTool(
      'film_list_projects',
      {
        title: '재단 프로젝트 목록',
        description: '인테리어 필름 재단 프로젝트 목록 (필름지/조각 수/손실율).',
        inputSchema: {},
      },
      () => this.call(async (api) => this.unwrap(await api.get('/film-optimizer/projects'))),
    );

    registerTool(
      'film_get_project',
      {
        title: '재단 프로젝트 상세',
        description: '프로젝트 상세: 필름지 정보, 재단 조각 목록(치수/수량/완료 여부), 패킹 결과.',
        inputSchema: { projectId: z.number().describe('프로젝트 id (film_list_projects로 확인)') },
      },
      ({ projectId }) => this.call(async (api) => this.unwrap(await api.get(`/film-optimizer/projects/${projectId}`))),
    );

    return server;
  }
}
