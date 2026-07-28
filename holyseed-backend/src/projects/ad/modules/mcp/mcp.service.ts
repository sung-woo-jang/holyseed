import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { AdUser } from '../users/entities/ad-user.entity';
import { McpToken } from './entities/mcp-token.entity';

/**
 * 자산일기 API를 MCP 도구로 노출 (조회 + 입력, 수정·삭제 제외).
 * 도구는 요청 시 URL의 개인 토큰으로 식별된 계정의 내부 JWT로 자기 REST API를 호출한다
 * — 가드·검증·멤버십 로직을 그대로 재사용. 계정마다 다른 요청일 수 있어 캐싱하지 않는다.
 */
@Injectable()
export class McpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(McpToken)
    private readonly tokenRepo: Repository<McpToken>,
  ) {}

  /** 토큰 → 소유 계정 조회. 없으면 null (컨트롤러가 404 처리) */
  async resolveUserByToken(token: string): Promise<AdUser | null> {
    const row = await this.tokenRepo.findOne({ where: { token }, relations: ['user'] });
    if (!row) return null;
    this.tokenRepo.update(row.id, { lastUsedAt: new Date() }).catch(() => {});
    return row.user;
  }

  /** 해당 계정 명의로 내부 JWT 발급 + axios 클라이언트 */
  private getApi(user: AdUser): AxiosInstance {
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, aud: 'ad' },
      { secret: this.configService.get('jwt.secret'), expiresIn: '365d' },
    );

    const port = this.configService.get('app.port', 8000);
    return axios.create({
      baseURL: `http://127.0.0.1:${port}/api/ad`,
      timeout: 15000,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }

  private async getHouseholdId(api: AxiosInstance): Promise<number> {
    const { data } = await api.get('/households');
    const households = data?.data ?? data;
    if (!Array.isArray(households) || households.length === 0) {
      throw new Error('가구가 없습니다. 앱에서 먼저 가구를 만들어 주세요.');
    }
    return households[0].id;
  }

  /** SuccessResponse 언래핑 후 MCP 텍스트 결과로 */
  private ok(payload: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] };
  }

  private fail(e: unknown) {
    const msg = (e as any)?.response?.data?.message ?? (e instanceof Error ? e.message : '요청에 실패했습니다.');
    return { content: [{ type: 'text' as const, text: `오류: ${msg}` }], isError: true };
  }

  private async call<T>(user: AdUser, fn: (api: AxiosInstance, hid: number) => Promise<T>) {
    try {
      const api = this.getApi(user);
      const hid = await this.getHouseholdId(api);
      const result = await fn(api, hid);
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
  createServer(user: AdUser): McpServer {
    const server = new McpServer({ name: 'asset-diary', version: '1.0.0' });

    // zod 3.25 + strictNullChecks:false 조합에서 registerTool 제네릭 추론이
    // TS2589(무한 인스턴스화)로 터짐 → 타입 추론만 우회 (런타임 zod 검증은 유지)
    const registerTool = (name: string, config: unknown, handler: (args: any) => unknown) =>
      (server.registerTool as any)(name, config, handler);

    registerTool(
      'get_dashboard',
      {
        title: '대시보드 조회',
        description: '가구의 순자산, 자산군별 구성(도넛), 월별 순자산 시계열을 조회합니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api, hid) => this.unwrap(await api.get(`/households/${hid}/dashboard`))),
    );

    registerTool(
      'list_assets',
      {
        title: '자산 목록',
        description:
          '가구의 자산 목록을 조회합니다. 각 자산의 최신/직전 스냅샷(평가액) 포함. 자산 id는 다른 도구 입력에 사용합니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api, hid) => this.unwrap(await api.get(`/households/${hid}/assets`))),
    );

    registerTool(
      'create_asset',
      {
        title: '자산 생성',
        description:
          '새 자산(계좌/투자상품 등)을 생성합니다. initialValue를 함께 넘기면 생성 직후 첫 평가액 스냅샷도 같이 저장합니다.',
        inputSchema: {
          name: z.string().describe('자산명 (예: 네이버페이, Kbank)'),
          category: z.enum(['CASH', 'INVESTMENT', 'CRYPTO', 'REAL_ASSET', 'PENSION', 'DEBT']).describe('자산군'),
          isLiability: z.boolean().optional().describe('부채 여부 (기본 false)'),
          memo: z.string().optional().describe('메모'),
          initialValue: z.number().optional().describe('초기 평가액 (원) — 넘기면 첫 스냅샷도 같이 저장'),
          date: z.string().optional().describe('초기 스냅샷 기준일 YYYY-MM-DD, 생략 시 오늘'),
        },
      },
      ({ name, category, isLiability, memo, initialValue, date }) =>
        this.call(user, async (api, hid) => {
          const asset = this.unwrap(await api.post(`/households/${hid}/assets`, { name, category, isLiability, memo }));
          if (initialValue != null) {
            await api.post(`/assets/${asset.id}/snapshots`, { date: date ?? this.today(), value: initialValue });
          }
          return asset;
        }),
    );

    registerTool(
      'list_snapshots',
      {
        title: '자산 스냅샷 히스토리',
        description: '특정 자산의 평가액 스냅샷 히스토리를 조회합니다.',
        inputSchema: { assetId: z.number().describe('자산 id (list_assets로 확인)') },
      },
      ({ assetId }) => this.call(user, async (api) => this.unwrap(await api.get(`/assets/${assetId}/snapshots`))),
    );

    registerTool(
      'upsert_snapshot',
      {
        title: '스냅샷 입력',
        description: '자산의 평가액 스냅샷을 입력합니다. 같은 날짜에 다시 입력하면 덮어씁니다.',
        inputSchema: {
          assetId: z.number().describe('자산 id'),
          value: z.number().describe('평가액 (원)'),
          date: z.string().optional().describe('YYYY-MM-DD, 생략 시 오늘'),
        },
      },
      ({ assetId, value, date }) =>
        this.call(user, async (api) =>
          this.unwrap(await api.post(`/assets/${assetId}/snapshots`, { date: date ?? this.today(), value })),
        ),
    );

    registerTool(
      'batch_upsert_snapshots',
      {
        title: '스냅샷 일괄 입력',
        description: '여러 자산의 평가액 스냅샷을 한 번에 입력합니다.',
        inputSchema: {
          items: z
            .array(
              z.object({
                assetId: z.number().describe('자산 id'),
                value: z.number().describe('평가액 (원)'),
                date: z.string().optional().describe('YYYY-MM-DD, 생략 시 오늘'),
              }),
            )
            .describe('입력할 스냅샷 목록'),
        },
      },
      ({ items }) =>
        this.call(user, async (api, hid) =>
          this.unwrap(
            await api.post(`/households/${hid}/snapshots/batch`, {
              items: items.map((i) => ({ ...i, date: i.date ?? this.today() })),
            }),
          ),
        ),
    );

    registerTool(
      'list_transactions',
      {
        title: '거래 내역 조회',
        description: '가구의 거래(수입/지출) 내역을 기간·유형으로 조회합니다.',
        inputSchema: {
          from: z.string().optional().describe('시작일 YYYY-MM-DD'),
          to: z.string().optional().describe('종료일 YYYY-MM-DD'),
          type: z.enum(['INCOME', 'EXPENSE']).optional().describe('거래 유형'),
          limit: z.number().optional().describe('최대 개수 (기본 50)'),
        },
      },
      ({ from, to, type, limit }) =>
        this.call(user, async (api, hid) =>
          this.unwrap(await api.post(`/households/${hid}/transactions/search`, { from, to, type, limit: limit ?? 50 })),
        ),
    );

    registerTool(
      'create_transaction',
      {
        title: '거래 추가',
        description: '수입 또는 지출 거래를 기록합니다. 카테고리는 list_categories로 id를 확인하세요.',
        inputSchema: {
          type: z.enum(['INCOME', 'EXPENSE']).describe('수입/지출'),
          amount: z.number().describe('금액 (원)'),
          date: z.string().optional().describe('YYYY-MM-DD, 생략 시 오늘'),
          memo: z.string().optional().describe('메모/내역'),
          categoryId: z.number().optional().describe('카테고리 id'),
          fromAssetId: z.number().optional().describe('출금 자산 id (지출)'),
          toAssetId: z.number().optional().describe('입금 자산 id (수입)'),
        },
      },
      ({ type, amount, date, memo, categoryId, fromAssetId, toAssetId }) =>
        this.call(user, async (api, hid) =>
          this.unwrap(
            await api.post(`/households/${hid}/transactions`, {
              date: date ?? this.today(),
              type,
              amount,
              memo,
              categoryId,
              fromAssetId,
              toAssetId,
            }),
          ),
        ),
    );

    registerTool(
      'list_recurring',
      {
        title: '정기 항목 목록',
        description: '매월 반복되는 정기 수입/지출 항목을 조회합니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api, hid) => this.unwrap(await api.get(`/households/${hid}/recurring`))),
    );

    registerTool(
      'create_recurring',
      {
        title: '정기 항목 추가',
        description: '매월 같은 날 반복되는 정기 수입/지출을 등록합니다.',
        inputSchema: {
          title: z.string().describe('항목 이름 (예: 넷플릭스)'),
          type: z.enum(['INCOME', 'EXPENSE']).describe('수입/지출'),
          amount: z.number().describe('금액 (원)'),
          dayOfMonth: z.number().min(1).max(31).describe('매월 결제일'),
          categoryId: z.number().optional().describe('카테고리 id'),
          fromAssetId: z.number().optional().describe('출금 자산 id (지출)'),
          toAssetId: z.number().optional().describe('입금 자산 id (수입)'),
          endDate: z.string().optional().describe('종료일 YYYY-MM-DD'),
        },
      },
      ({ title, type, amount, dayOfMonth, categoryId, fromAssetId, toAssetId, endDate }) =>
        this.call(user, async (api, hid) =>
          this.unwrap(
            await api.post(`/households/${hid}/recurring`, {
              title,
              type,
              amount,
              frequency: 'MONTHLY',
              dayOfMonth,
              startDate: this.today(),
              categoryId,
              fromAssetId,
              toAssetId,
              endDate,
            }),
          ),
        ),
    );

    registerTool(
      'toggle_recurring',
      {
        title: '정기 항목 활성/중지',
        description: '정기 항목의 활성 상태를 토글합니다.',
        inputSchema: { recurringId: z.number().describe('정기 항목 id (list_recurring으로 확인)') },
      },
      ({ recurringId }) =>
        this.call(user, async (api) => this.unwrap(await api.post(`/recurring/${recurringId}/toggle`))),
    );

    registerTool(
      'list_categories',
      {
        title: '카테고리 목록',
        description: '거래 카테고리(수입/지출) 목록을 조회합니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api, hid) => this.unwrap(await api.get(`/households/${hid}/categories`))),
    );

    registerTool(
      'get_yearly_comparison',
      {
        title: '연간 비교',
        description: '연도별 순자산과 자산군별 증감 기여를 조회합니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api, hid) => this.unwrap(await api.get(`/households/${hid}/comparison/yearly`))),
    );

    return server;
  }
}
