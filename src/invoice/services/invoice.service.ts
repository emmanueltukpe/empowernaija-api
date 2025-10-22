import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Business } from '../../business/entities/business.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async create(userId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    const business = await this.businessRepository.findOne({
      where: { id: dto.businessId, ownerId: userId },
    });

    if (!business) {
      throw new ForbiddenException('Business not found or access denied');
    }

    const subtotal = dto.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const vatRate = business.vatRegistered ? 7.5 : 0;
    const vatAmount = (subtotal * vatRate) / 100;
    const totalAmount = subtotal + vatAmount;

    const invoiceNumber = await this.generateInvoiceNumber(dto.businessId);

    const invoice = this.invoiceRepository.create({
      ...dto,
      invoiceNumber,
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
    });

    const saved = await this.invoiceRepository.save(invoice);
    this.logger.log(`Invoice created: ${saved.id} for business: ${dto.businessId}`);
    return saved;
  }

  async findAll(userId: string, businessId?: string): Promise<Invoice[]> {
    const query = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.business', 'business')
      .where('business.ownerId = :userId', { userId });

    if (businessId) {
      query.andWhere('invoice.businessId = :businessId', { businessId });
    }

    return query.orderBy('invoice.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.business', 'business')
      .where('invoice.id = :id', { id })
      .andWhere('business.ownerId = :userId', { userId })
      .getOne();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: string, userId: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);

    if (dto.lineItems) {
      const subtotal = dto.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const vatAmount = (subtotal * invoice.vatRate) / 100;
      const totalAmount = subtotal + vatAmount;

      Object.assign(invoice, dto, {
        subtotal,
        vatAmount,
        totalAmount,
      });
    } else {
      Object.assign(invoice, dto);
    }

    const updated = await this.invoiceRepository.save(invoice);
    this.logger.log(`Invoice updated: ${id}`);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const invoice = await this.findOne(id, userId);
    await this.invoiceRepository.remove(invoice);
    this.logger.log(`Invoice deleted: ${id}`);
  }

  async markAsPaid(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);
    invoice.status = InvoiceStatus.PAID;
    invoice.paidDate = new Date();
    const updated = await this.invoiceRepository.save(invoice);
    this.logger.log(`Invoice marked as paid: ${id}`);
    return updated;
  }

  private async generateInvoiceNumber(businessId: string): Promise<string> {
    const count = await this.invoiceRepository.count({ where: { businessId } });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}

