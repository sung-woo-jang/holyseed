import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { CreateQuoteDto } from './dto/request/create-quote.dto';
import { UpdateQuoteDto } from './dto/request/update-quote.dto';
import { CreateQuoteItemDto } from './dto/request/create-quote-item.dto';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteItem)
    private readonly quoteItemRepository: Repository<QuoteItem>,
  ) {}

  /**
   * 견적서 목록 조회 (페이지네이션)
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.items', 'items')
      .leftJoinAndSelect('items.productModel', 'productModel');

    // 상태 필터
    if (params.status) {
      queryBuilder.andWhere('quote.status = :status', { status: params.status });
    }

    // 검색 (제목 또는 고객명)
    if (params.search) {
      queryBuilder.andWhere(
        '(quote.title LIKE :search OR quote.customerName LIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    // 정렬
    queryBuilder.orderBy('quote.createdAt', 'DESC');

    // 총 개수
    const total = await queryBuilder.getCount();

    // 페이지네이션 적용
    const items = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 견적서 상세 조회
   */
  async findById(id: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['items', 'items.productModel', 'items.productModel.brand'],
      order: { items: { sortOrder: 'ASC' } },
    });

    if (!quote) {
      throw new NotFoundException('견적서를 찾을 수 없습니다.');
    }

    return quote;
  }

  /**
   * 견적서 생성
   */
  async create(dto: CreateQuoteDto): Promise<Quote> {
    const quote = this.quoteRepository.create({
      title: dto.title,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      memo: dto.memo,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      status: 'draft',
      totalAmount: 0,
    });

    const savedQuote = await this.quoteRepository.save(quote);

    // 항목 추가
    if (dto.items && dto.items.length > 0) {
      for (const itemDto of dto.items) {
        await this.addItem(savedQuote.id, itemDto);
      }
    }

    return await this.findById(savedQuote.id);
  }

  /**
   * 견적서 수정
   */
  async update(id: string, dto: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({ where: { id } });

    if (!quote) {
      throw new NotFoundException('견적서를 찾을 수 없습니다.');
    }

    if (dto.title !== undefined) {
      quote.title = dto.title;
    }

    if (dto.customerName !== undefined) {
      quote.customerName = dto.customerName;
    }

    if (dto.customerPhone !== undefined) {
      quote.customerPhone = dto.customerPhone;
    }

    if (dto.memo !== undefined) {
      quote.memo = dto.memo;
    }

    if (dto.validUntil !== undefined) {
      quote.validUntil = new Date(dto.validUntil);
    }

    await this.quoteRepository.save(quote);

    return await this.findById(id);
  }

  /**
   * 견적서 삭제
   */
  async delete(id: string): Promise<void> {
    const quote = await this.quoteRepository.findOne({ where: { id } });

    if (!quote) {
      throw new NotFoundException('견적서를 찾을 수 없습니다.');
    }

    await this.quoteRepository.remove(quote);
  }

  /**
   * 견적 항목 추가
   */
  async addItem(quoteId: string, dto: CreateQuoteItemDto): Promise<QuoteItem> {
    const quote = await this.quoteRepository.findOne({ where: { id: quoteId } });

    if (!quote) {
      throw new NotFoundException('견적서를 찾을 수 없습니다.');
    }

    const totalPrice = dto.quantity * dto.unitPrice;

    const item = this.quoteItemRepository.create({
      quoteId,
      productModelId: dto.productModelId,
      productName: dto.productName,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      totalPrice,
      note: dto.note,
      sortOrder: dto.sortOrder || 0,
    });

    const savedItem = await this.quoteItemRepository.save(item);

    // 총 금액 재계산
    await this.recalculateTotal(quoteId);

    return savedItem;
  }

  /**
   * 견적 항목 수정
   */
  async updateItem(quoteId: string, itemId: string, dto: CreateQuoteItemDto): Promise<QuoteItem> {
    const item = await this.quoteItemRepository.findOne({
      where: { id: itemId, quoteId },
    });

    if (!item) {
      throw new NotFoundException('견적 항목을 찾을 수 없습니다.');
    }

    if (dto.productModelId !== undefined) {
      item.productModelId = dto.productModelId;
    }

    if (dto.productName !== undefined) {
      item.productName = dto.productName;
    }

    if (dto.quantity !== undefined) {
      item.quantity = dto.quantity;
    }

    if (dto.unitPrice !== undefined) {
      item.unitPrice = dto.unitPrice;
    }

    if (dto.note !== undefined) {
      item.note = dto.note;
    }

    if (dto.sortOrder !== undefined) {
      item.sortOrder = dto.sortOrder;
    }

    item.totalPrice = item.quantity * item.unitPrice;

    await this.quoteItemRepository.save(item);

    // 총 금액 재계산
    await this.recalculateTotal(quoteId);

    return item;
  }

  /**
   * 견적 항목 삭제
   */
  async deleteItem(quoteId: string, itemId: string): Promise<void> {
    const item = await this.quoteItemRepository.findOne({
      where: { id: itemId, quoteId },
    });

    if (!item) {
      throw new NotFoundException('견적 항목을 찾을 수 없습니다.');
    }

    await this.quoteItemRepository.remove(item);

    // 총 금액 재계산
    await this.recalculateTotal(quoteId);
  }

  /**
   * 견적서 상태 변경
   */
  async updateStatus(id: string, status: 'draft' | 'sent' | 'accepted' | 'rejected'): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({ where: { id } });

    if (!quote) {
      throw new NotFoundException('견적서를 찾을 수 없습니다.');
    }

    quote.status = status;
    await this.quoteRepository.save(quote);

    return await this.findById(id);
  }

  /**
   * 견적서 복제
   */
  async duplicate(id: string): Promise<Quote> {
    const original = await this.findById(id);

    const duplicate = this.quoteRepository.create({
      title: `${original.title} (복사본)`,
      customerName: original.customerName,
      customerPhone: original.customerPhone,
      memo: original.memo,
      validUntil: original.validUntil,
      status: 'draft',
      totalAmount: 0,
    });

    const savedQuote = await this.quoteRepository.save(duplicate);

    // 항목 복제
    for (const item of original.items) {
      await this.addItem(savedQuote.id, {
        productModelId: item.productModelId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        note: item.note,
        sortOrder: item.sortOrder,
      });
    }

    return await this.findById(savedQuote.id);
  }

  /**
   * 총 금액 재계산
   */
  private async recalculateTotal(quoteId: string): Promise<void> {
    const items = await this.quoteItemRepository.find({
      where: { quoteId },
    });

    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

    await this.quoteRepository.update(quoteId, { totalAmount: total });
  }
}
