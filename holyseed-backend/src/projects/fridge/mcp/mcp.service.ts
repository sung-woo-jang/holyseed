import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { addDays, todayKst } from '../common/date.util';
import { PERSON_PALETTE } from '../common/seed';
import { FridgeMcpToken, FridgeUser } from '../entities';

type Place = '냉장' | '냉동' | '실온';
interface Person { id: number; name: string; color: string }
interface Freq { id: number; name: string; place: Place; days: number }
interface Ingredient { id: number; name: string; place: Place; exp: string }
interface ShopItem { id: number; name: string; done: boolean; note: string | null }
interface FridgeEventRow { id: number; date: string; time: string; title: string; personId: number | null; repeat: 'none' | 'weekly' }
interface State {
  household: { id: number; name: string };
  settings: { nightMode: 'auto' | 'off'; defaultDays: number };
  people: Person[];
  freq: Freq[];
  ingredients: Ingredient[];
  shop: ShopItem[];
  events: FridgeEventRow[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^(([01]\d|2[0-3]):[0-5]\d)?$/;

const daysBetween = (from: string, to: string) => {
  const t = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(to) - t(from)) / 86400000);
};
const expiryStatus = (d: number) => (d < 0 ? 'expired' : d <= 3 ? 'soon' : 'ok');

// ── 공통 스키마 조각 (설명을 한곳에서 관리) ──
const placeSchema = z.enum(['냉장', '냉동', '실온']);
const dateStr = (what: string) => z.string().regex(DATE_RE, 'YYYY-MM-DD 형식이어야 합니다.').describe(`${what} — YYYY-MM-DD 형식 (예: 2026-10-05)`);
const idStr = (what: string) => z.number().int().positive().describe(`${what}의 id (조회 도구로 확인)`);

/**
 * 냉장고 대시보드 API를 MCP 도구로 노출 (삭제 계열 제외).
 * 도구는 URL 토큰으로 식별된 계정 명의의 내부 JWT(aud: fridge)로 자기 REST API를 호출한다
 * — HouseholdGuard·검증·가구 격리 로직을 그대로 재사용.
 */
@Injectable()
export class FridgeMcpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(FridgeMcpToken) private readonly tokenRepo: Repository<FridgeMcpToken>,
  ) {}

  async resolveUserByToken(token: string): Promise<FridgeUser | null> {
    const row = await this.tokenRepo.findOne({ where: { token }, relations: { user: true } });
    if (!row?.user) return null;
    this.tokenRepo.update(row.id, { lastUsedAt: new Date() }).catch(() => undefined);
    return row.user;
  }

  private getApi(user: FridgeUser): AxiosInstance {
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, aud: 'fridge' },
      { secret: this.configService.get<string>('jwt.secret'), expiresIn: '1h' },
    );
    const port = this.configService.get<number>('app.port', 8000);
    return axios.create({
      baseURL: `http://127.0.0.1:${port}/api/fridge`,
      timeout: 15000,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }

  private ok(payload: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] };
  }

  private fail(e: unknown) {
    const raw = (e as any)?.response?.data?.message;
    const msg = Array.isArray(raw) ? raw.join(', ') : (raw ?? (e instanceof Error ? e.message : '요청에 실패했습니다.'));
    return { content: [{ type: 'text' as const, text: `오류: ${msg}` }], isError: true };
  }

  private async call<T>(user: FridgeUser, fn: (api: AxiosInstance) => Promise<T>) {
    try {
      return this.ok(await fn(this.getApi(user)));
    } catch (e) {
      return this.fail(e);
    }
  }

  private unwrap = (res: { data: any }) => res.data?.data ?? res.data;
  private state = async (api: AxiosInstance): Promise<State> => this.unwrap(await api.get('/state'));

  /** personId / personName / everyone 중 하나로 담당자를 결정. undefined면 "지정 안 함"(수정 시 유지) */
  private resolvePerson(
    st: State,
    a: { personId?: number | null; personName?: string; everyone?: boolean },
  ): number | null | undefined {
    if (a.everyone) return null;
    if (a.personId !== undefined) return a.personId;
    if (a.personName) {
      const hit = st.people.find((p) => p.name === a.personName.trim());
      if (!hit) throw new Error(`'${a.personName}' 구성원이 없습니다. 등록된 구성원: ${st.people.map((p) => p.name).join(', ') || '(없음)'}`);
      return hit.id;
    }
    return undefined;
  }

  private personName(st: State, id: number | null) {
    return id == null ? '모두' : (st.people.find((p) => p.id === id)?.name ?? null);
  }

  private ingredientView(i: Ingredient, today: string) {
    const daysLeft = daysBetween(today, i.exp);
    return { ...i, daysLeft, status: expiryStatus(daysLeft) };
  }

  /** 기간 내 일정 전개 — 매주 반복은 시작일 이후 같은 요일마다 나타난다(앱 캘린더와 동일 규칙) */
  private expandEvents(st: State, from: string, to: string, expand: boolean) {
    const rows: (FridgeEventRow & { occurrenceDate: string; personName: string | null })[] = [];
    for (const e of st.events) {
      const push = (date: string) =>
        rows.push({ ...e, occurrenceDate: date, personName: this.personName(st, e.personId) });
      if (e.date >= from && e.date <= to) push(e.date);
      if (expand && e.repeat === 'weekly') {
        let d = addDays(e.date, 7);
        if (d < from) d = addDays(e.date, Math.ceil(daysBetween(e.date, from) / 7) * 7);
        for (; d <= to; d = addDays(d, 7)) push(d);
      }
    }
    return rows.sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate) || a.time.localeCompare(b.time) || a.id - b.id);
  }

  createServer(user: FridgeUser): McpServer {
    const server = new McpServer({ name: 'fridge-dashboard', version: '1.0.0' });

    // zod 3.25 + strictNullChecks:false 조합에서 registerTool 제네릭 추론이 TS2589로 터져 타입만 우회
    const registerTool = (name: string, config: unknown, handler: (args: any) => unknown) =>
      (server.registerTool as any)(name, config, handler);

    // ════════════ 조회 ════════════

    registerTool(
      'get_summary',
      {
        title: '오늘의 냉장고 요약',
        description:
          '가구의 오늘 현황을 한 번에 보여줍니다: 오늘(및 내일) 일정, 유통기한이 지났거나 임박(3일 이내)한 재료, 아직 안 산 장보기 항목. ' +
          '"오늘 뭐 있어?", "상하기 전에 먹어야 할 거 알려줘" 같은 질문의 시작점으로 쓰세요.',
        inputSchema: {
          soonDays: z.number().int().min(0).max(60).optional().describe('이 일수 이내에 만료되는 재료를 "임박"으로 포함 (기본 3)'),
          eventDays: z.number().int().min(1).max(31).optional().describe('오늘부터 며칠치 일정을 보여줄지 (기본 2 = 오늘+내일)'),
        },
      },
      ({ soonDays = 3, eventDays = 2 }) =>
        this.call(user, async (api) => {
          const st = await this.state(api);
          const today = todayKst();
          const ing = st.ingredients.map((i) => this.ingredientView(i, today));
          return {
            today,
            household: st.household.name,
            events: this.expandEvents(st, today, addDays(today, eventDays - 1), true),
            expired: ing.filter((i) => i.daysLeft < 0),
            expiringSoon: ing.filter((i) => i.daysLeft >= 0 && i.daysLeft <= soonDays),
            shoppingOpen: st.shop.filter((s) => !s.done),
            counts: { ingredients: st.ingredients.length, shoppingDone: st.shop.filter((s) => s.done).length },
          };
        }),
    );

    registerTool(
      'get_state',
      {
        title: '전체 데이터 스냅샷',
        description:
          '가구 이름·설정(야간모드·기본 유통기한 일수), 구성원 라벨(people), 자주 사는 것(freq), 재료(ingredients), 장보기(shop), 일정(events)을 한 번에 조회합니다. ' +
          '앱 화면이 쓰는 것과 같은 원본이며, 대부분은 더 가벼운 list_* 도구로 충분합니다. 일정은 반복 전개 전의 원본입니다.',
        inputSchema: {},
      },
      () => this.call(user, (api) => this.state(api)),
    );

    registerTool(
      'get_me',
      {
        title: '내 계정·가구 정보',
        description: '이 커넥터가 연결된 구글 계정 정보와 소속 가구(이름·야간모드·기본 유통기한 일수·내 역할 OWNER/MEMBER)를 조회합니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api) => this.unwrap(await api.get('/me'))),
    );

    registerTool(
      'list_household_members',
      {
        title: '가구 구성원(로그인 계정) 목록',
        description:
          '가구에 참여 중인 로그인 계정 목록(이름·이메일·역할). 일정 담당자로 쓰는 "구성원 라벨"(list_people)과는 별개입니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api) => this.unwrap(await api.get('/household/members'))),
    );

    registerTool(
      'list_people',
      {
        title: '일정 담당자(구성원 라벨) 목록',
        description:
          '캘린더 일정의 "누구 일정"으로 지정할 수 있는 라벨 목록(id·이름·색). 로그인하지 않는 아이 등도 포함될 수 있습니다. 일정 생성/수정 시 personId에 이 id를 씁니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api) => (await this.state(api)).people),
    );

    registerTool(
      'list_freq_items',
      {
        title: '자주 사는 것 목록',
        description:
          '자주 사는 품목과 그 기본 보관 위치·기본 유통기한 일수. 장보기 → "냉장고에 넣기"(stock_shop_items)나 재료 추가 시 기본값으로 쓰입니다.',
        inputSchema: {
          query: z.string().optional().describe('이름에 포함된 글자로 필터 (예: "우")'),
          place: placeSchema.optional().describe('보관 위치로 필터'),
        },
      },
      ({ query, place }) =>
        this.call(user, async (api) =>
          (await this.state(api)).freq.filter((f) => (!query || f.name.includes(query)) && (!place || f.place === place)),
        ),
    );

    registerTool(
      'list_events',
      {
        title: '일정 조회',
        description:
          '기간 내 캘린더 일정을 날짜·시간순으로 조회합니다. 매주 반복 일정은 시작일 이후 같은 요일마다 전개되어 나오며(occurrenceDate), ' +
          '원래 등록 날짜는 date, 수정/조회에 쓰는 id는 모든 회차가 동일합니다. 시간이 빈 문자열이면 종일 일정입니다.',
        inputSchema: {
          from: dateStr('조회 시작일(포함)').optional().describe('조회 시작일(포함) YYYY-MM-DD, 생략 시 오늘'),
          to: dateStr('조회 종료일(포함)').optional().describe('조회 종료일(포함) YYYY-MM-DD, 생략 시 시작일 + 13일(2주)'),
          personId: z.number().int().optional().describe('이 구성원의 일정만 (list_people의 id). 생략하면 전체'),
          personName: z.string().optional().describe('personId 대신 구성원 이름으로 필터 (예: "엄마")'),
          includeEveryone: z.boolean().optional().describe('구성원 필터 시 "모두" 일정도 포함할지 (기본 true — 앱 화면과 동일)'),
          query: z.string().optional().describe('제목에 포함된 글자로 필터'),
          expandRepeats: z.boolean().optional().describe('매주 반복 일정을 기간 내 모든 회차로 전개할지 (기본 true, false면 등록 날짜가 기간 내인 것만)'),
          limit: z.number().int().min(1).max(500).optional().describe('최대 반환 개수 (기본 200)'),
        },
      },
      (a) =>
        this.call(user, async (api) => {
          const st = await this.state(api);
          const from = a.from ?? todayKst();
          const to = a.to ?? addDays(from, 13);
          const who = this.resolvePerson(st, a);
          const incEveryone = a.includeEveryone ?? true;
          const rows = this.expandEvents(st, from, to, a.expandRepeats ?? true).filter(
            (e) =>
              (who === undefined || e.personId === who || (incEveryone && e.personId === null)) &&
              (!a.query || e.title.includes(a.query)),
          );
          return { from, to, count: rows.length, events: rows.slice(0, a.limit ?? 200) };
        }),
    );

    registerTool(
      'list_ingredients',
      {
        title: '재료(냉장고 속) 조회',
        description:
          '냉장고에 있는 재료를 유통기한 임박순으로 조회합니다. 각 재료에 남은 일수(daysLeft: 오늘 기준, 음수면 지남)와 상태' +
          '(expired=만료, soon=3일 이내 임박, ok=여유)를 붙여 줍니다.',
        inputSchema: {
          place: placeSchema.optional().describe('보관 위치로 필터: 냉장 / 냉동 / 실온'),
          status: z.enum(['all', 'expired', 'soon', 'ok']).optional().describe('상태 필터 — expired(만료), soon(3일 이내 임박, 만료 제외), ok(여유). 기본 all'),
          withinDays: z.number().int().min(0).max(3650).optional().describe('오늘부터 이 일수 이내에 만료되는 재료만 (이미 만료된 것도 포함). 예: 7'),
          query: z.string().optional().describe('이름에 포함된 글자로 검색 (예: "우유")'),
          sort: z.enum(['exp', 'name']).optional().describe('정렬: exp(유통기한 빠른 순, 기본) / name(이름 가나다순)'),
          limit: z.number().int().min(1).max(500).optional().describe('최대 반환 개수 (기본 200)'),
        },
      },
      (a) =>
        this.call(user, async (api) => {
          const st = await this.state(api);
          const today = todayKst();
          let rows = st.ingredients.map((i) => this.ingredientView(i, today));
          if (a.place) rows = rows.filter((i) => i.place === a.place);
          if (a.status && a.status !== 'all') rows = rows.filter((i) => i.status === a.status);
          if (a.withinDays != null) rows = rows.filter((i) => i.daysLeft <= a.withinDays);
          if (a.query) rows = rows.filter((i) => i.name.includes(a.query));
          rows.sort(a.sort === 'name' ? (x, y) => x.name.localeCompare(y.name, 'ko') : (x, y) => x.daysLeft - y.daysLeft || x.id - y.id);
          return { today, count: rows.length, ingredients: rows.slice(0, a.limit ?? 200) };
        }),
    );

    registerTool(
      'list_shopping_items',
      {
        title: '장보기 목록 조회',
        description:
          '장보기 항목을 조회합니다. done=false는 아직 안 산 것, done=true는 장바구니에 "담은(구매 완료)" 것이며 stock_shop_items로 냉장고 재료로 옮길 수 있습니다. ' +
          'note는 메모입니다(예: "다 먹음", "2팩").',
        inputSchema: {
          status: z.enum(['open', 'done', 'all']).optional().describe('open=아직 안 산 것 / done=샀음(담은 것) / all=전체 (기본)'),
          query: z.string().optional().describe('이름 또는 메모에 포함된 글자로 검색'),
        },
      },
      ({ status = 'all', query }) =>
        this.call(user, async (api) => {
          const rows = (await this.state(api)).shop.filter(
            (s) =>
              (status === 'all' || (status === 'done') === s.done) &&
              (!query || s.name.includes(query) || (s.note ?? '').includes(query)),
          );
          return { count: rows.length, items: rows };
        }),
    );

    // ════════════ 일정 ════════════

    registerTool(
      'create_event',
      {
        title: '일정 추가',
        description:
          '캘린더에 일정을 추가합니다. 담당자는 personId 또는 personName으로 지정하고, 둘 다 생략하거나 everyone=true면 "모두" 일정입니다. ' +
          '시간을 생략하면 종일 일정입니다. repeat=weekly면 시작일 이후 매주 같은 요일에 반복 표시됩니다.',
        inputSchema: {
          date: dateStr('일정 날짜(반복이면 시작일)'),
          title: z.string().min(1).max(100).describe('일정 제목 1~100자 (예: "치과 예약")'),
          time: z.string().regex(TIME_RE).optional().describe('시작 시각 24시간제 HH:mm (예: "14:30"). 생략하거나 빈 문자열이면 종일 일정'),
          personId: z.number().int().nullable().optional().describe('담당 구성원 id (list_people). null이면 "모두"'),
          personName: z.string().optional().describe('personId 대신 구성원 이름으로 지정 (예: "아빠") — 등록된 이름과 정확히 일치해야 함'),
          everyone: z.boolean().optional().describe('true면 구성원과 무관한 "모두" 일정'),
          repeat: z.enum(['none', 'weekly']).optional().describe('none=한 번만(기본) / weekly=매주 같은 요일 반복'),
        },
      },
      (a) =>
        this.call(user, async (api) => {
          const st = await this.state(api);
          const personId = this.resolvePerson(st, a) ?? null;
          return this.unwrap(
            await api.post('/events/create', {
              date: a.date,
              time: a.time ?? '',
              title: a.title,
              personId,
              repeat: a.repeat ?? 'none',
            }),
          );
        }),
    );

    registerTool(
      'update_event',
      {
        title: '일정 수정',
        description:
          '기존 일정의 일부 항목만 바꿉니다(넘긴 항목만 변경, 나머지는 유지). id는 list_events로 확인. ' +
          '종일로 바꾸려면 time을 빈 문자열("")로, 담당자를 "모두"로 바꾸려면 everyone=true(또는 personId=null)로 넘기세요. ' +
          '반복 일정의 date를 바꾸면 반복 시작일이 바뀝니다.',
        inputSchema: {
          id: idStr('일정'),
          title: z.string().min(1).max(100).optional().describe('새 제목'),
          date: dateStr('새 날짜').optional().describe('새 날짜 YYYY-MM-DD'),
          time: z.string().regex(TIME_RE).optional().describe('새 시작 시각 HH:mm, 빈 문자열("")이면 종일'),
          personId: z.number().int().nullable().optional().describe('새 담당 구성원 id, null이면 "모두"'),
          personName: z.string().optional().describe('새 담당 구성원 이름'),
          everyone: z.boolean().optional().describe('true면 담당자를 "모두"로'),
          repeat: z.enum(['none', 'weekly']).optional().describe('반복 설정 변경'),
        },
      },
      (a) =>
        this.call(user, async (api) => {
          const { id, personId: _p, personName: _n, everyone: _e, ...rest } = a;
          const body: Record<string, unknown> = { ...rest };
          const st = await this.state(api);
          const pid = this.resolvePerson(st, a);
          if (pid !== undefined) body.personId = pid;
          if (!Object.keys(body).length) throw new Error('수정할 항목을 하나 이상 넘겨 주세요.');
          return this.unwrap(await api.post(`/events/${id}/update`, body));
        }),
    );

    // ════════════ 재료 ════════════

    registerTool(
      'create_ingredient',
      {
        title: '재료 추가',
        description:
          '냉장고에 재료를 추가합니다. 유통기한은 우선순위대로 결정됩니다: ① exp 직접 지정 → ② shelfLifeDays(오늘 + N일) → ' +
          '③ "자주 사는 것"에 같은 이름이 있으면 그 기본 일수 → ④ 가구 기본 유통기한 일수. 보관 위치(place)를 생략하면 자주 사는 것의 위치, 없으면 냉장입니다. ' +
          '응답의 resolved에 실제 적용된 값과 근거가 들어 있습니다.',
        inputSchema: {
          name: z.string().min(1).max(50).describe('재료 이름 1~50자 (예: "우유")'),
          place: placeSchema.optional().describe('보관 위치: 냉장 / 냉동 / 실온. 생략 시 자주 사는 것 기준, 없으면 냉장'),
          exp: dateStr('유통기한').optional().describe('유통기한 YYYY-MM-DD (직접 지정)'),
          shelfLifeDays: z.number().int().min(1).max(3650).optional().describe('오늘부터 며칠 뒤까지 보관할지 (exp를 생략했을 때 사용). 예: 7 → 일주일 뒤'),
        },
      },
      (a) =>
        this.call(user, async (api) => {
          const st = await this.state(api);
          const f = st.freq.find((x) => x.name === a.name.trim());
          const place: Place = a.place ?? f?.place ?? '냉장';
          let exp: string;
          let source: string;
          if (a.exp) [exp, source] = [a.exp, 'exp 직접 지정'];
          else if (a.shelfLifeDays) [exp, source] = [addDays(todayKst(), a.shelfLifeDays), `shelfLifeDays ${a.shelfLifeDays}일`];
          else if (f) [exp, source] = [addDays(todayKst(), f.days), `자주 사는 것 '${f.name}' ${f.days}일`];
          else [exp, source] = [addDays(todayKst(), st.settings.defaultDays), `가구 기본 ${st.settings.defaultDays}일`];
          const created = this.unwrap(await api.post('/ingredients/create', { name: a.name, place, exp }));
          return { ingredient: created, resolved: { place, exp, source } };
        }),
    );

    registerTool(
      'update_ingredient',
      {
        title: '재료 수정',
        description:
          '재료의 이름·보관 위치·유통기한을 바꿉니다(넘긴 항목만 변경). 유통기한은 exp로 날짜를 직접 지정하거나, ' +
          'extendDays로 현재(또는 exp로 준) 기한에서 N일 연장/단축할 수 있습니다. id는 list_ingredients로 확인.',
        inputSchema: {
          id: idStr('재료'),
          name: z.string().min(1).max(50).optional().describe('새 이름'),
          place: placeSchema.optional().describe('새 보관 위치 (냉장 / 냉동 / 실온) — 냉동실로 옮길 때 등'),
          exp: dateStr('새 유통기한').optional().describe('새 유통기한 YYYY-MM-DD'),
          extendDays: z.number().int().min(-3650).max(3650).optional().describe('기한을 상대값으로 조정: +3이면 3일 연장, -2면 2일 단축 (exp와 같이 주면 exp를 기준으로 계산)'),
        },
      },
      (a) =>
        this.call(user, async (api) => {
          const { id, extendDays, ...rest } = a;
          const body: Record<string, unknown> = { ...rest };
          if (extendDays != null) {
            let base = a.exp;
            if (!base) {
              const cur = (await this.state(api)).ingredients.find((i) => i.id === id);
              if (!cur) throw new Error('재료를 찾을 수 없습니다.');
              base = cur.exp;
            }
            body.exp = addDays(base, extendDays);
          }
          if (!Object.keys(body).length) throw new Error('수정할 항목을 하나 이상 넘겨 주세요.');
          return this.unwrap(await api.post(`/ingredients/${id}/update`, body));
        }),
    );

    registerTool(
      'finish_ingredient',
      {
        title: '재료 "다 먹었어요" 처리',
        description:
          '재료를 다 먹은 것으로 처리합니다. 앱의 "다 먹었어요" 버튼과 같습니다: 재료 목록에서 빠지고, 장보기에 아직 안 산 같은 이름이 없으면 메모 "다 먹음"으로 장보기에 자동 추가됩니다. ' +
          '재료는 id 또는 정확한 이름 중 하나로 지정하세요.',
        inputSchema: {
          id: z.number().int().positive().optional().describe('재료 id (list_ingredients)'),
          name: z.string().optional().describe('id 대신 정확한 재료 이름. 같은 이름이 여러 개면 id로 지정해야 함'),
        },
      },
      (a) =>
        this.call(user, async (api) => {
          let id = a.id;
          if (id == null) {
            if (!a.name) throw new Error('id 또는 name 중 하나를 넘겨 주세요.');
            const hits = (await this.state(api)).ingredients.filter((i) => i.name === a.name.trim());
            if (!hits.length) throw new Error(`'${a.name}' 재료가 없습니다.`);
            if (hits.length > 1) throw new Error(`'${a.name}'이(가) ${hits.length}개 있습니다. id로 지정해 주세요: ${hits.map((h) => `${h.id}(${h.exp})`).join(', ')}`);
            id = hits[0].id;
          }
          return this.unwrap(await api.post(`/ingredients/${id}/finish`));
        }),
    );

    // ════════════ 장보기 ════════════

    const shopItemSchema = {
      name: z.string().min(1).max(50).describe('품목 이름 1~50자 (예: "두부")'),
      note: z.string().max(50).optional().describe('메모 최대 50자 (예: "2팩", "유기농으로", "다 먹음")'),
      done: z.boolean().optional().describe('이미 샀으면 true (장바구니에 담은 상태로 추가). 기본 false'),
    };

    registerTool(
      'add_shop_item',
      {
        title: '장보기 항목 추가',
        description:
          '장보기 목록에 품목 하나를 추가합니다. 같은 이름이 아직 안 산 상태로 이미 있으면 중복 추가되지 않고 오류를 돌려줍니다. 여러 개는 add_shop_items를 쓰세요.',
        inputSchema: shopItemSchema,
      },
      (a) => this.call(user, async (api) => this.unwrap(await api.post('/shop/create', a))),
    );

    registerTool(
      'add_shop_items',
      {
        title: '장보기 항목 여러 개 추가',
        description:
          '장보기 품목 여러 개를 한 번에 추가합니다. 이미 있는 이름은 건너뛰고(skipped) 나머지는 추가(created)하며, 일부 실패해도 전체가 실패하지 않습니다.',
        inputSchema: { items: z.array(z.object(shopItemSchema)).min(1).max(50).describe('추가할 품목들 (최대 50개)') },
      },
      ({ items }) =>
        this.call(user, async (api) => {
          const created: unknown[] = [];
          const skipped: { name: string; reason: string }[] = [];
          for (const it of items) {
            try {
              created.push(this.unwrap(await api.post('/shop/create', it)));
            } catch (e) {
              skipped.push({ name: it.name, reason: (e as any)?.response?.data?.message ?? '실패' });
            }
          }
          return { created, skipped };
        }),
    );

    registerTool(
      'update_shop_item',
      {
        title: '장보기 항목 수정',
        description:
          '장보기 항목의 이름·구매 여부·메모를 바꿉니다(넘긴 항목만 변경). done=true는 "샀음(장바구니에 담음)", false는 되돌리기입니다. ' +
          '메모를 지우려면 note를 빈 문자열("")로 넘기세요. id는 list_shopping_items로 확인.',
        inputSchema: {
          id: idStr('장보기 항목'),
          name: z.string().min(1).max(50).optional().describe('새 이름'),
          done: z.boolean().optional().describe('샀으면 true, 안 산 상태로 되돌리려면 false'),
          note: z.string().max(50).nullable().optional().describe('새 메모(최대 50자). ""또는 null이면 메모 삭제'),
        },
      },
      ({ id, ...rest }) =>
        this.call(user, async (api) => {
          const body: Record<string, unknown> = { ...rest };
          if (body.note === '') body.note = null;
          if (!Object.keys(body).length) throw new Error('수정할 항목을 하나 이상 넘겨 주세요.');
          return this.unwrap(await api.post(`/shop/${id}/update`, body));
        }),
    );

    registerTool(
      'set_shop_items_done',
      {
        title: '장보기 항목 일괄 체크',
        description: '여러 장보기 항목을 한 번에 "샀음"(done=true) 또는 "안 산 상태"(done=false)로 바꿉니다. 마트에서 한꺼번에 체크할 때 편합니다.',
        inputSchema: {
          ids: z.array(z.number().int().positive()).min(1).max(100).describe('대상 장보기 항목 id들 (list_shopping_items)'),
          done: z.boolean().describe('true=샀음 / false=안 산 상태로 되돌림'),
        },
      },
      ({ ids, done }) =>
        this.call(user, async (api) => {
          const updated: unknown[] = [];
          const failed: { id: number; reason: string }[] = [];
          for (const id of ids) {
            try {
              updated.push(this.unwrap(await api.post(`/shop/${id}/update`, { done })));
            } catch (e) {
              failed.push({ id, reason: (e as any)?.response?.data?.message ?? '실패' });
            }
          }
          return { updated, failed };
        }),
    );

    registerTool(
      'stock_shop_items',
      {
        title: '산 것 냉장고에 넣기',
        description:
          '장보기에서 "샀음(done)"으로 체크된 항목을 전부 재료로 옮깁니다(앱의 "냉장고에 넣기"). 자주 사는 것에 같은 이름이 있으면 그 보관 위치·기본 일수, 없으면 냉장 + 가구 기본 유통기한 일수가 적용되며, ' +
          '옮긴 항목은 장보기에서 사라집니다. 반환값의 count는 옮긴 개수(0이면 체크된 항목이 없음)입니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api) => this.unwrap(await api.post('/shop/stock'))),
    );

    // ════════════ 자주 사는 것 · 구성원 라벨 ════════════

    registerTool(
      'create_freq_item',
      {
        title: '자주 사는 것 추가',
        description: '자주 사는 품목을 등록합니다. 장보기 → 냉장고에 넣기 때 이 품목의 보관 위치·유통기한 일수가 자동 적용됩니다. 같은 이름은 중복 등록할 수 없습니다.',
        inputSchema: {
          name: z.string().min(1).max(50).describe('품목 이름 1~50자 (예: "우유")'),
          place: placeSchema.describe('기본 보관 위치: 냉장 / 냉동 / 실온'),
          days: z.number().int().min(1).max(3650).describe('기본 유통기한 일수(구매일 + N일). 예: 우유 7, 계란 21'),
        },
      },
      (a) => this.call(user, async (api) => this.unwrap(await api.post('/freq/create', a))),
    );

    registerTool(
      'update_freq_item',
      {
        title: '자주 사는 것 수정',
        description: '자주 사는 품목의 이름·기본 보관 위치·기본 유통기한 일수를 바꿉니다(넘긴 항목만 변경). id는 list_freq_items로 확인.',
        inputSchema: {
          id: idStr('자주 사는 것'),
          name: z.string().min(1).max(50).optional().describe('새 이름 (다른 품목과 중복 불가)'),
          place: placeSchema.optional().describe('새 기본 보관 위치'),
          days: z.number().int().min(1).max(3650).optional().describe('새 기본 유통기한 일수'),
        },
      },
      ({ id, ...rest }) =>
        this.call(user, async (api) => {
          if (!Object.keys(rest).length) throw new Error('수정할 항목을 하나 이상 넘겨 주세요.');
          return this.unwrap(await api.post(`/freq/${id}/update`, rest));
        }),
    );

    registerTool(
      'create_person',
      {
        title: '일정 담당자(구성원 라벨) 추가',
        description:
          '캘린더에서 "누구 일정"으로 구분할 구성원 라벨을 추가합니다(로그인 계정과 무관, 아이·반려동물도 가능). 색을 생략하면 아직 안 쓰인 기본 팔레트 색이 자동 선택됩니다.',
        inputSchema: {
          name: z.string().min(1).max(30).describe('이름 1~30자 (예: "하준")'),
          color: z.string().min(1).max(40).optional().describe('표시 색상 — CSS 색 문자열 (예: "#f0a53a", "oklch(0.8 0.09 255)"). 생략 시 자동'),
        },
      },
      ({ name, color }) =>
        this.call(user, async (api) => {
          let c = color;
          if (!c) {
            const used = new Set((await this.state(api)).people.map((p) => p.color));
            c = PERSON_PALETTE.find((x) => !used.has(x)) ?? PERSON_PALETTE[used.size % PERSON_PALETTE.length];
          }
          return this.unwrap(await api.post('/people/create', { name, color: c }));
        }),
    );

    registerTool(
      'update_person',
      {
        title: '일정 담당자(구성원 라벨) 수정',
        description: '구성원 라벨의 이름·색을 바꿉니다(넘긴 항목만 변경). id는 list_people로 확인.',
        inputSchema: {
          id: idStr('구성원'),
          name: z.string().min(1).max(30).optional().describe('새 이름'),
          color: z.string().min(1).max(40).optional().describe('새 색상 (CSS 색 문자열)'),
        },
      },
      ({ id, ...rest }) =>
        this.call(user, async (api) => {
          if (!Object.keys(rest).length) throw new Error('수정할 항목을 하나 이상 넘겨 주세요.');
          return this.unwrap(await api.post(`/people/${id}/update`, rest));
        }),
    );

    // ════════════ 가구 설정 ════════════

    registerTool(
      'update_household_settings',
      {
        title: '가구 설정 변경',
        description: '가구 이름, 야간모드, 기본 유통기한 일수를 바꿉니다(넘긴 항목만 변경).',
        inputSchema: {
          name: z.string().min(1).max(50).optional().describe('새 가구 이름 1~50자'),
          nightMode: z.enum(['auto', 'off']).optional().describe('야간모드: auto=밤 22시~아침 6시에 화면을 어둡게 / off=끔'),
          defaultDays: z.number().int().min(1).max(60).optional().describe('기본 유통기한 일수 1~60 — 자주 사는 것에 없는 품목을 냉장고에 넣을 때 적용'),
        },
      },
      (a) =>
        this.call(user, async (api) => {
          if (!Object.keys(a).length) throw new Error('수정할 항목을 하나 이상 넘겨 주세요.');
          return this.unwrap(await api.post('/household/update', a));
        }),
    );

    registerTool(
      'create_invite_code',
      {
        title: '가족 초대 코드 발급',
        description:
          '가족이 가구에 합류할 때 입력하는 초대 코드(8자)를 발급합니다. 7일간 유효하고 1회만 쓸 수 있으며, 가구 방장(OWNER)만 발급할 수 있습니다.',
        inputSchema: {},
      },
      () => this.call(user, async (api) => this.unwrap(await api.post('/household/invite'))),
    );

    return server;
  }
}
