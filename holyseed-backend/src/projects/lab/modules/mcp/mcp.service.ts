import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { LabUser } from '../users/entities/lab-user.entity';
import { buildBuyLadder, buildSellLadder } from '../vr/core';

/**
 * lab 대시보드 API를 MCP 도구로 노출 (VR/근무일지/지출내역).
 * 도구는 env LAB_MCP_USER_EMAIL 계정의 내부 JWT로 자기 REST API를 호출한다
 * — 가드·검증·계산 로직을 그대로 재사용.
 * AD MCP(ad/modules/mcp)가 소유자 계정 토큰으로 접속했을 때만 registerTools()를
 * 호출해서 도구를 얹는 방식으로 통합되어 있음 — 이 서비스는 더 이상 자기 HTTP
 * 엔드포인트를 갖지 않는다(과거 /api/lab/mcp/:secret는 제거됨).
 */
@Injectable()
export class LabMcpService {
  private api: AxiosInstance | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(LabUser)
    private readonly userRepo: Repository<LabUser>,
  ) {}

  /** 지정 계정으로 내부 JWT 발급 + axios 클라이언트 (lazy) */
  private async getApi(): Promise<AxiosInstance> {
    if (this.api) return this.api;

    const email = (this.configService.get('LAB_MCP_USER_EMAIL') || '').toLowerCase();
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error(`MCP 계정(${email})을 찾을 수 없습니다. LAB_MCP_USER_EMAIL을 확인하세요.`);

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, aud: 'lab' },
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

  /** 주어진 McpServer 인스턴스에 lab 도구들을 등록 (서버 자체는 호출부가 만듦) */
  registerTools(server: McpServer): void {
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
          const buy = buildBuyLadder({
            quantity: state.quantity,
            minBand: state.minBand,
            pool: state.pool,
            usablePool: state.usablePool,
            steps: n,
          });
          const sell = buildSellLadder({
            quantity: state.quantity,
            maxBand: state.maxBand,
            pool: state.pool,
            steps: n,
          });
          return {
            기준: {
              보유수량: state.quantity,
              최소밴드: state.minBand,
              최대밴드: state.maxBand,
              Pool: state.pool,
              사용가능Pool: state.usablePool,
            },
            매수표: buy.map((r) => ({
              체결후보유: r.qtyAfter,
              트리거가: r.triggerPrice,
              Pool잔액: r.poolAfter,
              한도초과: r.exceedsLimit,
            })),
            매도표: sell.map((r) => ({ 체결후보유: r.qtyAfter, 트리거가: r.triggerPrice, Pool잔액: r.poolAfter })),
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

    registerTool(
      'vr_get_price',
      {
        title: 'VR 실시간 시세',
        description: 'TQQQ 실시간 시세를 조회합니다 (60초 캐시).',
        inputSchema: {},
      },
      () => this.call(async (api) => this.unwrap(await api.get('/vr/price'))),
    );

    registerTool(
      'vr_get_cash_balance',
      {
        title: 'VR 실계좌 예수금',
        description:
          '토스증권 실계좌 예수금 중 VR(TQQQ) 몫만 조회합니다(무매/SOXL 몫은 제외, 5분 캐시). vr_get_state의 Pool은 내부 장부상 잔고이고 이건 실제 증권사 예수금이라 서로 다른 값일 수 있습니다.',
        inputSchema: {},
      },
      () => this.call(async (api) => this.unwrap(await api.get('/vr/cash-balance'))),
    );

    registerTool(
      'vr_get_status',
      {
        title: 'VR 엔진 종합 상태',
        description:
          '엔진 상태 + 사이클 히스토리 + 최근 이벤트 로그 + 활성 세션 + 시장 개장 캘린더를 한 번에 묶어서 조회합니다. vr_get_state보다 훨씬 넓은 범위의 스냅샷이며, 대시보드 화면이 그대로 쓰는 데이터입니다.',
        inputSchema: {},
      },
      () => this.call(async (api) => this.unwrap(await api.get('/vr/status'))),
    );

    registerTool(
      'vr_get_events',
      {
        title: 'VR 엔진 이벤트 로그',
        description:
          '엔진 실행 로그를 커서 기반으로 페이지네이션 조회합니다. 특정 시각에 왜 매수/매도가 (안) 일어났는지, 엔진이 dry-run/live 중 어느 쪽으로 돌았는지 등을 확인할 때 씁니다.',
        inputSchema: {
          cursor: z.number().optional().describe('이전 응답의 다음 커서 값 (생략 시 0, 최신부터)'),
          level: z.enum(['all', 'info', 'warn', 'error']).optional().describe('로그 레벨 필터 (기본 all)'),
        },
      },
      ({ cursor, level }) =>
        this.call(async (api) =>
          this.unwrap(await api.get('/vr/events', { params: { cursor: cursor ?? 0, level: level ?? 'all' } })),
        ),
    );

    registerTool(
      'vr_get_candles',
      {
        title: 'VR 가격 캔들',
        description:
          'TQQQ 일봉 캔들 데이터를 조회합니다 (5분 캐시). range=all이나 긴 기간은 응답이 클 수 있으니, 최근 추세만 필요하면 3m 정도로 좁혀서 쓰세요.',
        inputSchema: {
          range: z.enum(['1m', '3m', 'all', 'intraday']).optional().describe('조회 범위 (기본 3m)'),
        },
      },
      ({ range }) => this.call(async (api) => this.unwrap(await api.get('/vr/candles', { params: { range: range ?? '3m' } }))),
    );

    registerTool(
      'vr_get_cycles',
      {
        title: 'VR 사이클 히스토리',
        description: '지금까지의 VR 사이클 전체 히스토리를 조회합니다 (V값·기간·Pool 등, 사이클 단위 요약).',
        inputSchema: {},
      },
      () => this.call(async (api) => this.unwrap(await api.get('/vr/cycles'))),
    );

    registerTool(
      'vr_create_cycle',
      {
        title: 'VR 사이클 수동 등록',
        description:
          '사이클을 정상적인 V 갱신 절차(vr_rollover) 없이 직접 등록합니다. 과거 데이터 임포트나 최초 세팅처럼 예외적인 상황에서만 쓰는 도구입니다 — 평소 V 갱신일 처리에는 반드시 vr_rollover를 쓰세요. 실행 전 사용자에게 왜 수동 등록이 필요한지 확인하세요.',
        inputSchema: {
          cycleNo: z.number().int().min(1).describe('사이클 번호'),
          startDate: z.string().describe('시작일 YYYY-MM-DD'),
          endDate: z.string().describe('종료일 YYYY-MM-DD'),
          vValue: z.number().describe('이 사이클의 V값'),
          poolStart: z.number().describe('시작 Pool ($)'),
          depositAmount: z.number().optional().describe('적립금 ($, 생략 가능)'),
        },
      },
      (args) => this.call(async (api) => this.unwrap(await api.post('/vr/cycles', args))),
    );

    registerTool(
      'vr_update_settings',
      {
        title: 'VR 설정 수정',
        description:
          'VR(TQQQ 밸류 리밸런싱) 설정을 수정합니다: symbol(종목)/gFactor(G, 기울기)/bandPct(밴드 %)/depositAmount(사이클당 적립금 $)/poolLimitPct(Pool 사용 한도 %)/cardOrder·hiddenCards(Overview 화면 카드 표시 설정). ' +
          '⚠️ 중요: depositAmount 등을 바꿔도 이미 진행 중인(열려있는) 사이클에는 소급 반영되지 않습니다 — 사이클 시작 시점에 스냅샷된 값을 계속 쓰고, 변경한 값은 다음 vr_rollover(V 갱신) 때부터만 적용됩니다. 이건 실계좌 라이브 자동매매 시스템의 설정이므로, 사용자가 명확히 요청한 값만 반영하고 임의로 바꾸지 마세요.',
        inputSchema: {
          symbol: z.string().optional().describe('종목 코드'),
          gFactor: z.number().int().min(1).optional().describe('G (기울기)'),
          bandPct: z.number().optional().describe('밴드 (%)'),
          depositAmount: z.number().optional().describe('사이클당 적립금 ($) — 다음 V 갱신부터 적용, 현재 열린 사이클엔 영향 없음'),
          poolLimitPct: z.number().optional().describe('Pool 사용 한도 (%)'),
          cardOrder: z.array(z.string()).optional().describe('Overview 화면 통계 카드 표시 순서 (카드 id 배열)'),
          hiddenCards: z.array(z.string()).optional().describe('Overview 화면에서 숨길 카드 id 목록'),
        },
      },
      (args) => this.call(async (api) => this.unwrap(await api.post('/vr/settings/update', args))),
    );

    registerTool(
      'vr_run_engine',
      {
        title: 'VR 엔진 수동 실행',
        description:
          '⚠️ VR 자동매매 엔진을 지금 즉시 수동으로 실행합니다. live=true로 호출하면 실제 증권사에 라이브 주문이 나갑니다(진짜 돈이 움직임) — live:true는 사용자가 명시적으로 "지금 실주문 실행해"라고 확인해준 경우에만 호출하세요. live=false(기본값)는 dry-run이라 실제 주문 없이 시뮬레이션 로그만 남기므로 언제든 안전하게 실행해볼 수 있습니다.',
        inputSchema: {
          live: z.boolean().optional().describe('true=실주문 실행, false(기본)=dry-run(안전)'),
        },
      },
      ({ live }) => this.call(async (api) => this.unwrap(await api.post('/vr/run', { live: live === true }))),
    );

    // ==================== 근무일지 ====================

    registerTool(
      'worklog_query',
      {
        title: '근무일지 조회 (기간·분류·수령여부·업무·현장명 필터)',
        description:
          '근무 기록을 조회합니다. year+month(기본 이번 달) 또는 from~to(YYYY-MM-DD, 월 경계 넘는 범위도 가능) 중 하나로 기간을 지정하고, category/payStatus/jobs/titleContains로 좁힐 수 있습니다. 응답에 집계(근무일수/합계/실수령/수령·미수령)도 함께 옵니다. 실수령 = 금액 × 0.967 (원천징수 3.3%) — withholding=false로 끌 수 있습니다.',
        inputSchema: {
          year: z.number().optional().describe('연도 (from/to 없을 때, 기본 올해)'),
          month: z.number().min(1).max(12).optional().describe('월 1~12 (from/to 없을 때, 기본 이번 달)'),
          from: z.string().optional().describe('조회 시작일 YYYY-MM-DD, 지정하면 year/month보다 우선'),
          to: z.string().optional().describe('조회 종료일 YYYY-MM-DD, from만 있으면 오늘까지'),
          category: z.string().optional().describe('분류명으로 필터 (worklog_options로 등록된 값 확인)'),
          payStatus: z.enum(['RECEIVED', 'EXPECTED', 'UNPAID', 'DAYOFF', 'SCHEDULED']).optional().describe('수령여부 필터 (SCHEDULED=근무예정)'),
          jobs: z.array(z.string()).optional().describe('이 업무 중 하나라도 포함된 기록만'),
          titleContains: z.string().optional().describe('현장명 부분 검색'),
          withholding: z
            .boolean()
            .optional()
            .describe(
              '원천징수(3.3%) 적용 여부, 기본 true. false면 세전 금액(amount)만 오고 netAmount·totalNet·receivedNet·pendingNet은 응답에서 빠짐',
            ),
        },
      },
      (args) => this.call(async (api) => this.unwrap(await api.post('/worklog/query', args))),
    );

    registerTool(
      'worklog_options',
      {
        title: '근무일지 분류/업무/현장명 팔레트 조회',
        description:
          '등록된 분류(category) 목록, 업무(jobs) 목록, 현장명(titleOptions) 목록을 조회합니다. worklog_add/worklog_update/worklog_query에 넣을 값을 확인할 때 사용하세요. 현장명은 분류별로 따로 관리되며(같은 이름이라도 분류가 다르면 별개 항목) 최근 사용순으로 옵니다.',
        inputSchema: {},
      },
      () =>
        this.call(async (api) => {
          const [categories, jobs, titleOptions] = await Promise.all([
            this.unwrap(await api.get('/worklog/category-options')),
            this.unwrap(await api.get('/worklog/job-options')),
            this.unwrap(await api.get('/worklog/title-options')),
          ]);
          return { categories, jobs, titleOptions };
        }),
    );

    registerTool(
      'worklog_category_add',
      {
        title: '근무일지 분류 추가',
        description:
          '새 분류(예: 청소, 이사)를 추가합니다. 기본값(일급여/원천징수/초과근무 임계시간·가산율/기본 시작·종료시각/기본 휴게시간/기본 주소)을 같이 지정할 수 있고, 전부 생략하면 근무 기록 작성 시 그때그때 자동/수동으로 채워집니다. 여기서 정한 기본값은 이후 그 분류로 근무 기록을 새로 만들 때만 미리 채워지고, 기존 기록에는 소급 반영되지 않습니다.',
        inputSchema: {
          name: z.string().describe('분류 이름'),
          defaultDailyWage: z.number().optional().describe('기본 일급여 (원, 미설정 시 날짜 기준 자동)'),
          defaultWithholdingApplied: z.boolean().optional().describe('원천징수(3.3%) 기본 적용 여부 (기본 true)'),
          overtimeThresholdHours: z.number().optional().describe('초과근무 임계시간 (기본 8)'),
          overtimeExtraRate: z.number().optional().describe('초과근무 가산율, 0~1 (기본 0.1 = 10%)'),
          defaultStartTime: z.string().optional().describe('기본 시작 시각 HH:mm'),
          defaultEndTime: z.string().optional().describe('기본 종료 시각 HH:mm'),
          defaultBreakHours: z.number().optional().describe('기본 휴게시간 (기본 1시간)'),
          defaultAddress: z.string().optional().describe('기본 주소'),
        },
      },
      (args) => this.call(async (api) => this.unwrap(await api.post('/worklog/category-options', args))),
    );

    registerTool(
      'worklog_category_update',
      {
        title: '근무일지 분류 기본값 수정',
        description:
          '기존 분류의 이름이나 기본값을 수정합니다(worklog_category_add와 같은 필드들, 넘긴 필드만 부분 수정). 기존 근무 기록에는 영향 없습니다(생성 시점에 이미 스냅샷됨).',
        inputSchema: {
          id: z.number().describe('분류 id (worklog_options로 확인)'),
          name: z.string().optional(),
          defaultDailyWage: z.number().nullable().optional(),
          defaultWithholdingApplied: z.boolean().optional(),
          overtimeThresholdHours: z.number().optional(),
          overtimeExtraRate: z.number().optional(),
          defaultStartTime: z.string().nullable().optional(),
          defaultEndTime: z.string().nullable().optional(),
          defaultBreakHours: z.number().nullable().optional(),
          defaultAddress: z.string().nullable().optional(),
        },
      },
      ({ id, ...rest }) =>
        this.call(async (api) => this.unwrap(await api.post('/worklog/category-options/update', { id, ...rest }))),
    );

    registerTool(
      'worklog_category_reorder',
      {
        title: '근무일지 분류 순서 변경',
        description:
          '분류가 앱 화면에 표시되는 순서를 바꿉니다. 현재 등록된 분류 전체의 id를 빠짐없이, 원하는 순서대로 나열해야 합니다 — 일부만 넘기면 실패합니다(worklog_options로 현재 전체 목록을 먼저 확인하세요).',
        inputSchema: { ids: z.array(z.number()).describe('전체 분류 id를 원하는 순서로 나열') },
      },
      ({ ids }) => this.call(async (api) => this.unwrap(await api.post('/worklog/category-options/reorder', { ids }))),
    );

    registerTool(
      'worklog_job_add',
      {
        title: '근무일지 업무 추가',
        description: '특정 분류에 새 업무 항목(예: 도배, 타일)을 추가합니다. 업무는 분류별로 따로 관리됩니다.',
        inputSchema: {
          name: z.string().describe('업무 이름'),
          category: z.string().describe('소속 분류명 (worklog_options로 확인)'),
        },
      },
      ({ name, category }) => this.call(async (api) => this.unwrap(await api.post('/worklog/job-options', { name, category }))),
    );

    registerTool(
      'worklog_job_rename',
      {
        title: '근무일지 업무 이름 수정',
        description: '업무 팔레트 항목의 이름을 수정합니다. 기존 근무 기록에 이미 기록된 업무 태그는 바뀌지 않습니다(소급 반영 안 함).',
        inputSchema: {
          id: z.number().describe('업무 id (worklog_options로 확인)'),
          name: z.string().describe('새 이름'),
        },
      },
      ({ id, name }) => this.call(async (api) => this.unwrap(await api.post(`/worklog/job-options/${id}/update`, { name }))),
    );

    registerTool(
      'worklog_title_rename',
      {
        title: '근무일지 현장명 이름 수정',
        description:
          '현장명 팔레트(추천 목록) 항목의 이름을 수정합니다. 이미 저장된 과거 근무 기록의 현장명 텍스트는 바뀌지 않습니다(동명이현장 가능성 때문에 의도적으로 소급 반영 안 함) — 앞으로의 추천 목록에만 반영됩니다.',
        inputSchema: {
          id: z.number().describe('현장명 옵션 id (worklog_options로 확인)'),
          name: z.string().describe('새 현장명'),
        },
      },
      ({ id, name }) => this.call(async (api) => this.unwrap(await api.post(`/worklog/title-options/${id}/update`, { name }))),
    );

    registerTool(
      'worklog_add',
      {
        title: '근무 기록 추가',
        description:
          '근무 기록을 추가합니다. 금액은 항상 서버가 공식(공수·초과수당·휴게 점심1시간 기본 차감)대로 자동 계산하고 3.3% 원천징수 후 실수령으로 표시됩니다 — 실수령이 계산과 다르면 amountOverride로 실제 금액을 넣으세요(실수령 우선 원칙). 일급여는 날짜 기준 자동(현재 14만원). 분류(category)는 자유 문자열이며 사용자가 UI에서 직접 추가한 값을 쓸 수 있습니다 — 현재 등록된 분류는 worklog_options로 확인하세요 (기본값 인테리어). 휴무는 payStatus=DAYOFF.',
        inputSchema: {
          title: z.string().describe('현장명 (여러 곳이면 / 구분, 휴무면 "휴무")'),
          workDate: z.string().optional().describe('YYYY-MM-DD, 생략 시 오늘'),
          category: z.string().optional().describe('분류명 (기본 인테리어). 등록된 분류는 worklog_options로 확인'),
          startTime: z.string().optional().describe('시작 HH:mm (예 08:00)'),
          endTime: z.string().optional().describe('종료 HH:mm'),
          breakHours: z.number().optional().describe('휴게시간 (기본 1)'),
          jobs: z.array(z.string()).optional().describe('업무 (분류별로 등록된 항목이 다름)'),
          payStatus: z
            .enum(['RECEIVED', 'EXPECTED', 'UNPAID', 'DAYOFF', 'SCHEDULED'])
            .optional()
            .describe('수령여부 (기본 EXPECTED=예상(미수령), SCHEDULED=근무예정)'),
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
          category: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          breakHours: z.number().optional(),
          jobs: z.array(z.string()).optional(),
          payStatus: z.enum(['RECEIVED', 'EXPECTED', 'UNPAID', 'DAYOFF', 'SCHEDULED']).optional().describe('SCHEDULED=근무예정'),
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

    // ==================== 지출내역 ====================

    registerTool(
      'expense_month',
      {
        title: '지출내역 월별 조회',
        description:
          '해당 월의 수입/지출 기록과 집계(총수입/총지출/순현금흐름/고정지출 합계/분류별 합계)를 조회합니다.',
        inputSchema: {
          year: z.number().describe('연도 (예: 2026)'),
          month: z.number().min(1).max(12).describe('월 (1~12)'),
        },
      },
      ({ year, month }) => this.call(async (api) => this.unwrap(await api.post('/expense/search', { year, month }))),
    );

    registerTool(
      'expense_list_all',
      {
        title: '수입/지출 전체 이력 조회',
        description:
          '기간 제한 없이 전체 수입/지출 이력을 조회합니다. 보통은 월별 집계까지 나오는 expense_month를 쓰고, 전체 기간에 걸친 이력이 꼭 필요할 때만 이 도구를 쓰세요(기록이 많으면 응답이 길어질 수 있음).',
        inputSchema: {},
      },
      () => this.call(async (api) => this.unwrap(await api.get('/expense'))),
    );

    registerTool(
      'expense_add',
      {
        title: '수입/지출 기록 추가',
        description:
          '수입 또는 지출 기록을 추가합니다. kind=EXPENSE(지출)일 때만 expenseType 지정 — FIXED_SAME(고정-동일금액)/FIXED_VARIABLE(고정-가변금액)/IRREGULAR(비정기-다회성).',
        inputSchema: {
          title: z.string().describe('항목 (예: 월세, 급여)'),
          date: z.string().optional().describe('YYYY-MM-DD, 생략 시 오늘'),
          kind: z.enum(['EXPENSE', 'INCOME']).describe('구분'),
          category: z
            .string()
            .describe('분류 (예: 주거/통신/공과금/보험/차량·유류비/구독서비스/대출·할부/생활/급여/기타수입/기타지출)'),
          expenseType: z
            .enum(['FIXED_SAME', 'FIXED_VARIABLE', 'IRREGULAR'])
            .optional()
            .describe('지출유형 (지출만 해당)'),
          amount: z.number().describe('금액 (원)'),
          memo: z.string().optional().describe('메모'),
        },
      },
      (args) =>
        this.call(async (api) => this.unwrap(await api.post('/expense', { ...args, date: args.date ?? this.today() }))),
    );

    registerTool(
      'expense_update',
      {
        title: '수입/지출 기록 수정',
        description: '기존 수입/지출 기록을 수정합니다.',
        inputSchema: {
          id: z.number().describe('기록 id (expense_month로 확인)'),
          title: z.string().optional(),
          date: z.string().optional().describe('YYYY-MM-DD'),
          kind: z.enum(['EXPENSE', 'INCOME']).optional(),
          category: z.string().optional(),
          expenseType: z.enum(['FIXED_SAME', 'FIXED_VARIABLE', 'IRREGULAR']).nullable().optional(),
          amount: z.number().optional(),
          memo: z.string().optional(),
        },
      },
      ({ id, ...rest }) => this.call(async (api) => this.unwrap(await api.post(`/expense/${id}/update`, rest))),
    );

    registerTool(
      'expense_delete',
      {
        title: '수입/지출 기록 삭제',
        description: '수입/지출 기록을 삭제합니다. 삭제 전 사용자에게 확인하세요.',
        inputSchema: { id: z.number().describe('기록 id') },
      },
      ({ id }) => this.call(async (api) => this.unwrap(await api.post(`/expense/${id}/delete`))),
    );
  }
}
