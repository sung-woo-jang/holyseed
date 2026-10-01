import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import {
  FridgeEvent,
  FridgeFreqItem,
  FridgeHousehold,
  FridgeIngredient,
  FridgePerson,
  FridgeShopItem,
} from '../entities';
import { addDays, todayKst } from '../common/date.util';
import { buildSample, DEFAULT_FREQ } from '../common/seed';
import {
  CreateEventDto,
  CreateFreqDto,
  CreateIngredientDto,
  CreatePersonDto,
  CreateShopDto,
  UpdateEventDto,
  UpdateFreqDto,
  UpdateIngredientDto,
  UpdatePersonDto,
  UpdateShopDto,
} from './data.dto';

const personView = (p: FridgePerson) => ({ id: p.id, name: p.name, color: p.color });
const freqView = (f: FridgeFreqItem) => ({ id: f.id, name: f.name, place: f.place, days: f.days });
const ingredientView = (i: FridgeIngredient) => ({ id: i.id, name: i.name, place: i.place, exp: i.exp });
const shopView = (s: FridgeShopItem) => ({ id: s.id, name: s.name, done: s.done, note: s.note });
const eventView = (e: FridgeEvent) => ({
  id: e.id,
  date: e.date,
  time: e.time,
  title: e.title,
  personId: e.personId,
  repeat: e.repeat,
});

@Injectable()
export class DataService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(FridgeHousehold) private readonly householdRepo: Repository<FridgeHousehold>,
    @InjectRepository(FridgePerson) private readonly personRepo: Repository<FridgePerson>,
    @InjectRepository(FridgeFreqItem) private readonly freqRepo: Repository<FridgeFreqItem>,
    @InjectRepository(FridgeIngredient) private readonly ingredientRepo: Repository<FridgeIngredient>,
    @InjectRepository(FridgeShopItem) private readonly shopRepo: Repository<FridgeShopItem>,
    @InjectRepository(FridgeEvent) private readonly eventRepo: Repository<FridgeEvent>,
  ) {}

  /** 가구 id 조건을 항상 함께 걸어 타 가구 데이터는 존재하지 않는 것처럼(404) 취급 */
  private async mustFind<T extends ObjectLiteral>(repo: Repository<T>, householdId: number, id: number, label: string) {
    const row = await repo.findOne({ where: { id, householdId } as unknown as FindOptionsWhere<T> });
    if (!row) throw new NotFoundException(`${label}을(를) 찾을 수 없습니다.`);
    return row;
  }

  private async assertPerson(householdId: number, personId: number | null | undefined) {
    if (personId == null) return;
    await this.mustFind(this.personRepo, householdId, personId, '구성원');
  }

  // ── 스냅샷 ──

  async state(householdId: number) {
    const where = { householdId };
    const [household, people, freq, ingredients, shop, events] = await Promise.all([
      this.householdRepo.findOneOrFail({ where: { id: householdId } }),
      this.personRepo.find({ where, order: { id: 'ASC' } }),
      this.freqRepo.find({ where, order: { id: 'ASC' } }),
      this.ingredientRepo.find({ where, order: { exp: 'ASC', id: 'ASC' } }),
      this.shopRepo.find({ where, order: { id: 'ASC' } }),
      this.eventRepo.find({ where, order: { date: 'ASC', time: 'ASC', id: 'ASC' } }),
    ]);
    return {
      household: { id: household.id, name: household.name },
      settings: { nightMode: household.nightMode, defaultDays: household.defaultDays },
      people: people.map(personView),
      freq: freq.map(freqView),
      ingredients: ingredients.map(ingredientView),
      shop: shop.map(shopView),
      events: events.map(eventView),
    };
  }

  // ── 구성원 라벨(people) ──

  async createPerson(householdId: number, dto: CreatePersonDto) {
    return personView(await this.personRepo.save(this.personRepo.create({ householdId, ...dto })));
  }

  async updatePerson(householdId: number, id: number, dto: UpdatePersonDto) {
    const row = await this.mustFind(this.personRepo, householdId, id, '구성원');
    return personView(await this.personRepo.save(Object.assign(row, dto)));
  }

  async deletePerson(householdId: number, id: number) {
    const row = await this.mustFind(this.personRepo, householdId, id, '구성원');
    const first = await this.personRepo.findOne({ where: { householdId }, order: { id: 'ASC' } });
    if (first?.id === row.id) throw new ConflictException('기본 구성원은 삭제할 수 없어요.');
    // 지운 사람의 일정은 기본 구성원 몫으로 넘긴다
    await this.dataSource.transaction(async (em) => {
      await em.update(FridgeEvent, { householdId, personId: id }, { personId: first.id });
      await em.delete(FridgePerson, { id });
    });
  }

  // ── 자주 사는 것 ──

  async createFreq(householdId: number, dto: CreateFreqDto) {
    if (await this.freqRepo.exists({ where: { householdId, name: dto.name } })) {
      throw new ConflictException(`${dto.name}은(는) 이미 있어요.`);
    }
    return freqView(await this.freqRepo.save(this.freqRepo.create({ householdId, ...dto })));
  }

  async updateFreq(householdId: number, id: number, dto: UpdateFreqDto) {
    const row = await this.mustFind(this.freqRepo, householdId, id, '자주 사는 것');
    if (dto.name && dto.name !== row.name && (await this.freqRepo.exists({ where: { householdId, name: dto.name } }))) {
      throw new ConflictException(`${dto.name}은(는) 이미 있어요.`);
    }
    return freqView(await this.freqRepo.save(Object.assign(row, dto)));
  }

  async deleteFreq(householdId: number, id: number) {
    const row = await this.mustFind(this.freqRepo, householdId, id, '자주 사는 것');
    await this.freqRepo.delete({ id: row.id });
  }

  // ── 재료 ──

  async createIngredient(householdId: number, dto: CreateIngredientDto) {
    return ingredientView(await this.ingredientRepo.save(this.ingredientRepo.create({ householdId, ...dto })));
  }

  async updateIngredient(householdId: number, id: number, dto: UpdateIngredientDto) {
    const row = await this.mustFind(this.ingredientRepo, householdId, id, '재료');
    return ingredientView(await this.ingredientRepo.save(Object.assign(row, dto)));
  }

  async deleteIngredient(householdId: number, id: number) {
    const row = await this.mustFind(this.ingredientRepo, householdId, id, '재료');
    await this.ingredientRepo.delete({ id: row.id });
  }

  /** 다 먹었어요 → 재료 삭제 + (이미 담겨 있지 않으면) 장보기에 추가 */
  async finishIngredient(householdId: number, id: number) {
    const row = await this.mustFind(this.ingredientRepo, householdId, id, '재료');
    return this.dataSource.transaction(async (em) => {
      await em.delete(FridgeIngredient, { id: row.id });
      const already = await em.exists(FridgeShopItem, { where: { householdId, name: row.name, done: false } });
      if (already) return { name: row.name, addedToShop: false };
      await em.save(em.create(FridgeShopItem, { householdId, name: row.name, done: false, note: '다 먹음' }));
      return { name: row.name, addedToShop: true };
    });
  }

  // ── 장보기 ──

  /** 같은 이름이 아직 안 산 상태로 있으면 중복으로 만들지 않는다 */
  async createShop(householdId: number, dto: CreateShopDto) {
    const dup = await this.shopRepo.findOne({ where: { householdId, name: dto.name, done: false } });
    if (dup) throw new ConflictException(`${dto.name}은(는) 이미 있어요.`);
    return shopView(await this.shopRepo.save(this.shopRepo.create({ householdId, ...dto })));
  }

  async updateShop(householdId: number, id: number, dto: UpdateShopDto) {
    const row = await this.mustFind(this.shopRepo, householdId, id, '장보기 항목');
    return shopView(await this.shopRepo.save(Object.assign(row, dto)));
  }

  async deleteShop(householdId: number, id: number) {
    const row = await this.mustFind(this.shopRepo, householdId, id, '장보기 항목');
    await this.shopRepo.delete({ id: row.id });
  }

  async clearDoneShop(householdId: number) {
    const res = await this.shopRepo.delete({ householdId, done: true });
    return { count: res.affected ?? 0 };
  }

  /** 담은(done) 항목 → 재료로 이동. 자주 사는 것에 있으면 그 위치·기한, 없으면 냉장 + 기본 유통기한 */
  async stockShop(householdId: number) {
    return this.dataSource.transaction(async (em) => {
      const done = await em.find(FridgeShopItem, { where: { householdId, done: true } });
      if (!done.length) return { count: 0 };
      const household = await em.findOneOrFail(FridgeHousehold, { where: { id: householdId } });
      const freq = await em.find(FridgeFreqItem, { where: { householdId } });
      const byName = new Map(freq.map((f) => [f.name, f]));
      const today = todayKst();
      await em.save(
        done.map((item) => {
          const f = byName.get(item.name);
          return em.create(FridgeIngredient, {
            householdId,
            name: item.name,
            place: f?.place ?? '냉장',
            exp: addDays(today, f?.days ?? household.defaultDays),
          });
        }),
      );
      await em.delete(FridgeShopItem, { householdId, done: true });
      return { count: done.length };
    });
  }

  // ── 일정 ──

  async createEvent(householdId: number, dto: CreateEventDto) {
    await this.assertPerson(householdId, dto.personId);
    return eventView(await this.eventRepo.save(this.eventRepo.create({ householdId, ...dto, personId: dto.personId ?? null })));
  }

  async updateEvent(householdId: number, id: number, dto: UpdateEventDto) {
    const row = await this.mustFind(this.eventRepo, householdId, id, '일정');
    await this.assertPerson(householdId, dto.personId);
    return eventView(await this.eventRepo.save(Object.assign(row, dto)));
  }

  async deleteEvent(householdId: number, id: number) {
    const row = await this.mustFind(this.eventRepo, householdId, id, '일정');
    await this.eventRepo.delete({ id: row.id });
  }

  // ── 샘플 초기화 ──

  /** 가구의 데이터 전체를 시안 샘플로 교체 (구성원 라벨은 기본 1명만 남김, 설정도 기본값) */
  async resetSample(householdId: number) {
    await this.dataSource.transaction(async (em: EntityManager) => {
      const first = await em.findOne(FridgePerson, { where: { householdId }, order: { id: 'ASC' } });
      await em.delete(FridgeEvent, { householdId });
      await em.delete(FridgeIngredient, { householdId });
      await em.delete(FridgeShopItem, { householdId });
      await em.delete(FridgeFreqItem, { householdId });
      if (first) {
        await em
          .createQueryBuilder()
          .delete()
          .from(FridgePerson)
          .where('household_id = :householdId AND id <> :keep', { householdId, keep: first.id })
          .execute();
      }
      await em.update(FridgeHousehold, { id: householdId }, { nightMode: 'auto', defaultDays: 7 });

      const sample = buildSample(todayKst());
      await em.save(DEFAULT_FREQ.map((f) => em.create(FridgeFreqItem, { householdId, ...f })));
      await em.save(sample.ingredients.map((i) => em.create(FridgeIngredient, { householdId, ...i })));
      await em.save(sample.shop.map((s) => em.create(FridgeShopItem, { householdId, ...s })));
      await em.save(sample.events.map((e) => em.create(FridgeEvent, { householdId, personId: first?.id ?? null, ...e })));
    });
  }
}
