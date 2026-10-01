import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HouseholdId } from '../common/decorators';
import { HouseholdGuard } from '../common/household.guard';
import { ok } from '../common/ok';
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
import { DataService } from './data.service';

/** 가구 소속이 필수인 대시보드 데이터 API — 컨트롤러 전체에 HouseholdGuard 적용 */
@ApiTags('Fridge 데이터')
@ApiBearerAuth()
@UseGuards(HouseholdGuard)
@Controller('fridge')
export class DataController {
  constructor(private readonly service: DataService) {}

  @Get('state')
  @ApiOperation({ summary: '대시보드 전체 스냅샷 (설정·구성원·자주 사는 것·재료·장보기·일정)' })
  async state(@HouseholdId() hid: number) {
    return ok('조회 성공', await this.service.state(hid));
  }

  // ── people ──
  @Post('people/create')
  @ApiOperation({ summary: '구성원 라벨 추가' })
  async createPerson(@HouseholdId() hid: number, @Body() dto: CreatePersonDto) {
    return ok('추가했어요.', await this.service.createPerson(hid, dto));
  }

  @Post('people/:id/update')
  @ApiOperation({ summary: '구성원 라벨 수정' })
  async updatePerson(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePersonDto) {
    return ok('수정했어요.', await this.service.updatePerson(hid, id, dto));
  }

  @Post('people/:id/delete')
  @ApiOperation({ summary: '구성원 라벨 삭제 (일정은 기본 구성원으로 이동)' })
  async deletePerson(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number) {
    await this.service.deletePerson(hid, id);
    return ok('삭제했어요.');
  }

  // ── freq ──
  @Post('freq/create')
  @ApiOperation({ summary: '자주 사는 것 추가' })
  async createFreq(@HouseholdId() hid: number, @Body() dto: CreateFreqDto) {
    return ok('추가했어요.', await this.service.createFreq(hid, dto));
  }

  @Post('freq/:id/update')
  @ApiOperation({ summary: '자주 사는 것 수정' })
  async updateFreq(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFreqDto) {
    return ok('수정했어요.', await this.service.updateFreq(hid, id, dto));
  }

  @Post('freq/:id/delete')
  @ApiOperation({ summary: '자주 사는 것 삭제' })
  async deleteFreq(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteFreq(hid, id);
    return ok('삭제했어요.');
  }

  // ── ingredients ──
  @Post('ingredients/create')
  @ApiOperation({ summary: '재료 넣기' })
  async createIngredient(@HouseholdId() hid: number, @Body() dto: CreateIngredientDto) {
    return ok('넣었어요.', await this.service.createIngredient(hid, dto));
  }

  @Post('ingredients/:id/update')
  @ApiOperation({ summary: '재료 수정' })
  async updateIngredient(
    @HouseholdId() hid: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIngredientDto,
  ) {
    return ok('수정했어요.', await this.service.updateIngredient(hid, id, dto));
  }

  @Post('ingredients/:id/delete')
  @ApiOperation({ summary: '재료 삭제' })
  async deleteIngredient(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteIngredient(hid, id);
    return ok('삭제했어요.');
  }

  @Post('ingredients/:id/finish')
  @ApiOperation({ summary: '다 먹었어요 — 재료 삭제 + 장보기에 추가' })
  async finishIngredient(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number) {
    return ok('처리했어요.', await this.service.finishIngredient(hid, id));
  }

  // ── shop (정적 라우트를 :id 라우트보다 먼저) ──
  @Post('shop/create')
  @ApiOperation({ summary: '장보기 항목 추가' })
  async createShop(@HouseholdId() hid: number, @Body() dto: CreateShopDto) {
    return ok('담았어요.', await this.service.createShop(hid, dto));
  }

  @Post('shop/stock')
  @ApiOperation({ summary: '담은 물건을 냉장고(재료)로 이동' })
  async stockShop(@HouseholdId() hid: number) {
    return ok('냉장고에 넣었어요.', await this.service.stockShop(hid));
  }

  @Post('shop/clear-done')
  @ApiOperation({ summary: '담은 물건 지우기' })
  async clearDoneShop(@HouseholdId() hid: number) {
    return ok('지웠어요.', await this.service.clearDoneShop(hid));
  }

  @Post('shop/:id/update')
  @ApiOperation({ summary: '장보기 항목 수정 (체크 토글 포함)' })
  async updateShop(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShopDto) {
    return ok('수정했어요.', await this.service.updateShop(hid, id, dto));
  }

  @Post('shop/:id/delete')
  @ApiOperation({ summary: '장보기 항목 삭제' })
  async deleteShop(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteShop(hid, id);
    return ok('삭제했어요.');
  }

  // ── events ──
  @Post('events/create')
  @ApiOperation({ summary: '일정 추가' })
  async createEvent(@HouseholdId() hid: number, @Body() dto: CreateEventDto) {
    return ok('추가했어요.', await this.service.createEvent(hid, dto));
  }

  @Post('events/:id/update')
  @ApiOperation({ summary: '일정 수정' })
  async updateEvent(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto) {
    return ok('수정했어요.', await this.service.updateEvent(hid, id, dto));
  }

  @Post('events/:id/delete')
  @ApiOperation({ summary: '일정 삭제' })
  async deleteEvent(@HouseholdId() hid: number, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteEvent(hid, id);
    return ok('삭제했어요.');
  }

  // ── sample ──
  @Post('sample/reset')
  @ApiOperation({ summary: '샘플 데이터로 되돌리기 (가구 데이터 전체 교체)' })
  async resetSample(@HouseholdId() hid: number) {
    await this.service.resetSample(hid);
    return ok('처음 상태로 되돌렸어요.');
  }
}
