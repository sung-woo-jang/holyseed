import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { ProductModel } from '../product-models/entities/product-model.entity';
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
    @InjectRepository(ProductModel)
    private readonly productModelRepository: Repository<ProductModel>,
  ) {}

  async findAll(params: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.items', 'items');

    if (params.status) {
      queryBuilder.andWhere('quote.status = :status', { status: params.status });
    }
    if (params.search) {
      queryBuilder.andWhere(
        '(quote.title LIKE :search OR quote.customerName LIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    queryBuilder.orderBy('quote.createdAt', 'DESC');
    const total = await queryBuilder.getCount();
    const items = await queryBuilder.skip(skip).take(limit).getMany();

    return { items: items.map((q) => this.attachSubtotals(q)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<object> {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['items', 'items.productModel', 'items.productModel.brand'],
      order: { items: { sortOrder: 'ASC' } },
    });
    if (!quote) throw new NotFoundException('견적서를 찾을 수 없습니다.');
    return this.attachSubtotals(quote);
  }

  async create(dto: CreateQuoteDto): Promise<object> {
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

    if (dto.items && dto.items.length > 0) {
      for (const itemDto of dto.items) {
        await this.addItem(savedQuote.id, itemDto);
      }
    }
    return await this.findById(savedQuote.id);
  }

  async update(id: string, dto: UpdateQuoteDto): Promise<object> {
    const quote = await this.quoteRepository.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('견적서를 찾을 수 없습니다.');

    if (dto.title !== undefined) quote.title = dto.title;
    if (dto.customerName !== undefined) quote.customerName = dto.customerName;
    if (dto.customerPhone !== undefined) quote.customerPhone = dto.customerPhone;
    if (dto.memo !== undefined) quote.memo = dto.memo;
    if (dto.validUntil !== undefined) quote.validUntil = new Date(dto.validUntil);

    await this.quoteRepository.save(quote);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const quote = await this.quoteRepository.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('견적서를 찾을 수 없습니다.');
    await this.quoteRepository.remove(quote);
  }

  async addItem(quoteId: string, dto: CreateQuoteItemDto): Promise<QuoteItem> {
    const quote = await this.quoteRepository.findOne({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('견적서를 찾을 수 없습니다.');

    let materialPrice = dto.materialPrice ?? 0;
    let laborPrice = dto.laborPrice ?? 0;

    if (dto.productModelId) {
      const model = await this.productModelRepository.findOne({ where: { id: dto.productModelId } });
      if (model) {
        const mc = model.materialCost ?? 0;
        const mr = model.marginRate ?? 0;
        const lc = model.laborCost ?? 0;
        if (dto.materialPrice === undefined) materialPrice = Math.round(mc * (1 + mr / 100));
        if (dto.laborPrice === undefined) laborPrice = lc;
      }
    }

    if (dto.unitPrice !== undefined && dto.materialPrice === undefined && dto.laborPrice === undefined) {
      materialPrice = dto.unitPrice;
      laborPrice = 0;
    }

    const unitPrice = materialPrice + laborPrice;
    const totalPrice = dto.quantity * unitPrice;

    const item = this.quoteItemRepository.create({
      quoteId,
      productModelId: dto.productModelId,
      productName: dto.productName,
      quantity: dto.quantity,
      materialPrice,
      laborPrice,
      unitPrice,
      totalPrice,
      note: dto.note,
      sortOrder: dto.sortOrder ?? 0,
    });

    const savedItem = await this.quoteItemRepository.save(item);
    await this.recalculateTotal(quoteId);
    return savedItem;
  }

  async updateItem(quoteId: string, itemId: string, dto: CreateQuoteItemDto): Promise<QuoteItem> {
    const item = await this.quoteItemRepository.findOne({ where: { id: itemId, quoteId } });
    if (!item) throw new NotFoundException('견적 항목을 찾을 수 없습니다.');

    if (dto.productModelId !== undefined) item.productModelId = dto.productModelId;
    if (dto.productName !== undefined) item.productName = dto.productName;
    if (dto.quantity !== undefined) item.quantity = dto.quantity;
    if (dto.materialPrice !== undefined) item.materialPrice = dto.materialPrice;
    if (dto.laborPrice !== undefined) item.laborPrice = dto.laborPrice;
    if (dto.note !== undefined) item.note = dto.note;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;

    if (dto.materialPrice !== undefined || dto.laborPrice !== undefined) {
      item.unitPrice = item.materialPrice + item.laborPrice;
    } else if (dto.unitPrice !== undefined) {
      item.unitPrice = dto.unitPrice;
    }

    item.totalPrice = item.quantity * item.unitPrice;
    await this.quoteItemRepository.save(item);
    await this.recalculateTotal(quoteId);
    return item;
  }

  async deleteItem(quoteId: string, itemId: string): Promise<void> {
    const item = await this.quoteItemRepository.findOne({ where: { id: itemId, quoteId } });
    if (!item) throw new NotFoundException('견적 항목을 찾을 수 없습니다.');
    await this.quoteItemRepository.remove(item);
    await this.recalculateTotal(quoteId);
  }

  async updateStatus(id: string, status: 'draft' | 'sent' | 'accepted' | 'rejected'): Promise<object> {
    const quote = await this.quoteRepository.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('견적서를 찾을 수 없습니다.');
    quote.status = status;
    await this.quoteRepository.save(quote);
    return await this.findById(id);
  }

  async duplicate(id: string): Promise<object> {
    const original = await this.quoteRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!original) throw new NotFoundException('견적서를 찾을 수 없습니다.');

    const dup = this.quoteRepository.create({
      title: `${original.title} (복사본)`,
      customerName: original.customerName,
      customerPhone: original.customerPhone,
      memo: original.memo,
      validUntil: original.validUntil,
      status: 'draft',
      totalAmount: 0,
    });
    const savedQuote = await this.quoteRepository.save(dup);

    for (const item of original.items) {
      await this.addItem(savedQuote.id, {
        productModelId: item.productModelId,
        productName: item.productName,
        quantity: item.quantity,
        materialPrice: item.materialPrice,
        laborPrice: item.laborPrice,
        note: item.note,
        sortOrder: item.sortOrder,
      });
    }
    return await this.findById(savedQuote.id);
  }

  private async recalculateTotal(quoteId: string): Promise<void> {
    const items = await this.quoteItemRepository.find({ where: { quoteId } });
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    await this.quoteRepository.update(quoteId, { totalAmount: total });
  }

  private attachSubtotals(quote: Quote): object {
    const items = quote.items ?? [];
    const materialSubtotal = items.reduce((s, i) => s + (i.materialPrice ?? 0) * i.quantity, 0);
    const laborSubtotal = items.reduce((s, i) => s + (i.laborPrice ?? 0) * i.quantity, 0);
    return { ...quote, materialSubtotal, laborSubtotal };
  }
}
